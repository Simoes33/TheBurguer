export interface AgentConfig {
  backendUrl: string;
  storeId: string;
  deviceId: string;
  selectedPrinterName?: string;
  selectedPrinterAddress?: string;
}

export const DEFAULT_CONFIG: AgentConfig = {
  backendUrl: 'https://theburguer.onrender.com', // Altere para a URL real do backend se necessário
  storeId: 'default',
  deviceId: '',
};
