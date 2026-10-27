import { LostItem } from '../../../types';

export type DispatchSortField =
  | 'serial'
  | 'code'
  | 'dateFound'
  | 'itemName'
  | 'category'
  | 'employeeName'
  | 'dispatchDeadline'
  | 'urgency';

export type DispatchCategoryFilter = 'all' | 'overdue' | 'today' | 'upcoming';

export type ItemWithDiff = LostItem & { diffDays: number };
