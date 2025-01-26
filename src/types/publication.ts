export const enum PublicationInfoType {
  USER = 'user',
  COMPANY = 'company',
}

export interface IPublicationInfo {
  type: PublicationInfoType;
  alias: string;
  name: string;
  avatar?: string;
}