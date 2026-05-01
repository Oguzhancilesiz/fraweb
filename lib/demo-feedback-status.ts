/** API `DemoFeedbackStatus` (byte) ile hizalı. */
export const demoFeedbackStatusLabel = (status: number): string => {
  switch (status) {
    case 0:
      return "Yeni";
    case 1:
      return "İnceleniyor";
    case 2:
      return "Çözüldü";
    case 3:
      return "Arşiv";
    default:
      return `#${status}`;
  }
};
