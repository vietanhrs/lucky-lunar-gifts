use aiken/collection/list
use aiken/crypto.{VerificationKeyHash, sha2_256}
use aiken/interval.{Finite}
use cardano/transaction.{OutputReference, Transaction}

// ---------------------------------------------------------------------------
// Lucky ADA — Gift Escrow
//
// Each "red envelope" is a single UTxO locked at this validator's script
// address. A gift is therefore just a collection of such UTxOs that all share
// the same `secret_hash`.
//
//   * Anyone who knows the secret word can CLAIM an envelope by revealing the
//     preimage in the redeemer. The plaintext word is never stored on-chain —
//     only its hash — so the secret stays private until someone claims.
//   * The owner can REFUND (reclaim) any unclaimed envelope once the deadline
//     has passed.
//
// NOTE: this is a hash-lock. Once the first claim is submitted, the preimage
// becomes visible on-chain, so anyone could then claim the *remaining*
// envelopes that share the same secret. That trade-off matches the product
// (a secret shared among family/friends), but is called out here on purpose.
// ---------------------------------------------------------------------------

/// Datum stored with each locked gift envelope.
pub type GiftDatum {
  /// sha2-256 hash of the normalized secret word. The off-chain code MUST
  /// normalize the word (e.g. trim + lowercase) the same way before hashing,
  /// otherwise the hashes will never match.
  secret_hash: ByteArray,
  /// The gift owner's verification key hash — the only key allowed to reclaim
  /// the envelope after the deadline.
  owner: VerificationKeyHash,
  /// POSIX time in milliseconds. On/after this time the owner may refund.
  deadline: Int,
}

pub type GiftRedeemer {
  /// Claim the envelope by revealing the secret word preimage.
  Claim { answer: ByteArray }
  /// Owner reclaims the envelope after the deadline has passed.
  Refund
}

validator gift {
  spend(
    datum: Option<GiftDatum>,
    redeemer: GiftRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) {
    expect Some(GiftDatum { secret_hash, owner, deadline }) = datum

    when redeemer is {
      // The claimant must know the secret. They build a transaction that
      // spends this envelope and pays the value to themselves; the contract
      // only enforces knowledge of the secret word.
      Claim { answer } -> sha2_256(answer) == secret_hash

      // The owner may reclaim an unclaimed envelope, but only after the
      // deadline and only if they signed the transaction.
      Refund -> {
        let signed_by_owner = list.has(self.extra_signatories, owner)
        let after_deadline = is_after(self, deadline)
        signed_by_owner && after_deadline
      }
    }
  }

  else(_) {
    fail
  }
}

/// True when the transaction's validity range starts on or after `time`,
/// i.e. the transaction can only be accepted by the ledger once `time` has
/// passed. We require a finite lower bound so an unbounded range can't be
/// used to bypass the deadline.
fn is_after(self: Transaction, time: Int) -> Bool {
  when self.validity_range.lower_bound.bound_type is {
    Finite(lower) -> lower >= time
    _ -> False
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const test_owner: VerificationKeyHash =
  #"00000000000000000000000000000000000000000000000000000000"

const test_other: VerificationKeyHash =
  #"11111111111111111111111111111111111111111111111111111111"

fn mk_datum(word: ByteArray, deadline: Int) -> GiftDatum {
  GiftDatum { secret_hash: sha2_256(word), owner: test_owner, deadline }
}

fn placeholder_ref() -> OutputReference {
  OutputReference { transaction_id: #"", output_index: 0 }
}

test claim_with_correct_secret() {
  let datum = mk_datum("happy new year", 0)
  gift.spend(
    Some(datum),
    Claim { answer: "happy new year" },
    placeholder_ref(),
    transaction.placeholder,
  )
}

test claim_with_wrong_secret_fails() {
  let datum = mk_datum("happy new year", 0)
  !gift.spend(
    Some(datum),
    Claim { answer: "wrong answer" },
    placeholder_ref(),
    transaction.placeholder,
  )
}

test refund_by_owner_after_deadline() {
  let deadline = 1_700_000_000_000
  let datum = mk_datum("happy new year", deadline)
  let tx = Transaction {
    ..transaction.placeholder,
    extra_signatories: [test_owner],
    validity_range: interval.after(deadline),
  }
  gift.spend(Some(datum), Refund, placeholder_ref(), tx)
}

test refund_before_deadline_fails() {
  let deadline = 1_700_000_000_000
  let datum = mk_datum("happy new year", deadline)
  let tx = Transaction {
    ..transaction.placeholder,
    extra_signatories: [test_owner],
    validity_range: interval.after(deadline - 1),
  }
  !gift.spend(Some(datum), Refund, placeholder_ref(), tx)
}

test refund_by_non_owner_fails() {
  let deadline = 1_700_000_000_000
  let datum = mk_datum("happy new year", deadline)
  let tx = Transaction {
    ..transaction.placeholder,
    extra_signatories: [test_other],
    validity_range: interval.after(deadline),
  }
  !gift.spend(Some(datum), Refund, placeholder_ref(), tx)
}

test refund_with_unbounded_range_fails() {
  let deadline = 1_700_000_000_000
  let datum = mk_datum("happy new year", deadline)
  let tx = Transaction {
    ..transaction.placeholder,
    extra_signatories: [test_owner],
    validity_range: interval.everything,
  }
  !gift.spend(Some(datum), Refund, placeholder_ref(), tx)
}
