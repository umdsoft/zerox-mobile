/** Bildirishnoma bola komponentlari uchun umumiy prop turlari (faqat tur; runtime o'zgarishsiz). */
export type NotifHandler = (item: any, status: any, type?: any) => any;

export interface NotifBaseProps {
  item: any;
  okay: (id: any, type?: any) => any;
}
export interface NotifContractProps extends NotifBaseProps {
  onSuccess: NotifHandler;
  onReject: NotifHandler;
}
export interface NotifRepaidProps extends NotifBaseProps {
  onToliqQaytgan: NotifHandler;
  onQismanQaytarilgan: NotifHandler;
}
export interface NotifPartialProps extends NotifBaseProps {
  onToliqQaytgan: NotifHandler;
}
export interface NotifExtendAskProps extends NotifBaseProps {
  onQarzMuddatUzaytirish: NotifHandler;
  reject: NotifHandler;
}
