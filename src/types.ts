// Event types emitted by the vault contract

export interface CounterIncrementedEvent {
  event: "counter-incremented";
  caller: string;
  "new-value": number;
  "block-height": number;
}

export interface CounterDecrementedEvent {
  event: "counter-decremented";
  caller: string;
  "new-value": number;
  "block-height": number;
}

export interface DepositEvent {
  event: "deposit";
  user: string;
  amount: number;
  "new-balance": number;
  "unlock-block": number;
  "current-block": number;
}

export interface WithdrawEvent {
  event: "withdraw";
  user: string;
  amount: number;
  "unlock-block": number;
  "current-block": number;
}

export type VaultEvent =
  | CounterIncrementedEvent
  | CounterDecrementedEvent
  | DepositEvent
  | WithdrawEvent;

// Chainhook webhook payload structure
export interface ChainhookPayload {
  apply: Array<{
    block_identifier: {
      index: number;
      hash: string;
    };
    transactions: Array<{
      transaction_identifier: {
        hash: string;
      };
      operations: any[];
      metadata: {
        success: boolean;
        result: string;
        raw_tx: string;
        sender: string;
        fee: string;
        kind: {
          type: string;
          data: {
            contract_identifier: string;
            method: string;
            args: any[];
          };
        };
        receipt: {
          events: Array<{
            type: string;
            data: any;
          }>;
        };
      };
    }>;
  }>;
  rollback: any[];
  chainhook: {
    uuid: string;
    predicate: any;
  };
}

// Stored event in memory/database
export interface StoredEvent {
  id: string;
  eventType: string;
  eventData: VaultEvent;
  txHash: string;
  blockHeight: number;
  blockHash: string;
  timestamp: number;
}









