export {};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { address: string; zonecode?: string }) => void;
      }) => {
        open: () => void;
      };
    };
  }
}
