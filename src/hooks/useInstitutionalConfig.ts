import { useEffect, useState } from 'react';
import { InstitutionalConfig } from '../types/siaa';
import { SIAADataService } from '../services/siaaService';

export function useInstitutionalConfig(): InstitutionalConfig {
  const [config, setConfig] = useState<InstitutionalConfig>(() =>
    SIAADataService.getInstitutionalConfig()
  );

  useEffect(() => {
    const sync = () => {
      setConfig(SIAADataService.getInstitutionalConfig());
    };
    window.addEventListener('siaa-config-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('siaa-config-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return config;
}
