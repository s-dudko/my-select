export interface ISelectValue {
  label: string;
  value: string;
}

export const enum SelectActions {
  CLOSE = 'close',
  CLOSE_SELECT = 'close-select',
  FIRST = 'first',
  LAST = 'last',
  NEXT = 'next',
  OPEN = 'open',
  PAGE_DOWN = 'page-down',
  PAGE_UP = 'page-up',
  PREVIOUS = 'previous',
  SELECT = 'select',
  TYPE = 'type',
}
