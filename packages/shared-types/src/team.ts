import { Player } from './player';
import { Coach } from './coach';

export interface Team {
  id: string;
  name: string;
  players: Player[];
  coach?: Coach;
  /** Optional finance fields for offseason and contract systems */
  salaryCap?: number;
  budget?: number;
}
