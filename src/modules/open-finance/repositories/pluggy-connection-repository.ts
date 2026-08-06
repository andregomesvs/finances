import type { PluggyConnection } from "../domain/pluggy-connection";

export interface PluggyConnectionRepository {
  list(userId: string): Promise<PluggyConnection[]>;
  findByItemId(itemId: string, userId: string): Promise<PluggyConnection | null>;
  save(connection: PluggyConnection): Promise<void>;
}
