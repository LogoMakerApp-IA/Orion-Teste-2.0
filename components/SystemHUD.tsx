import React from 'react';
import { Battery, Wifi, WifiOff, Clock, Zap } from 'lucide-react';
import { DeviceContext } from '../types';

interface SystemHUDProps {
  context: DeviceContext;
}

const SystemHUD: React.FC<SystemHUDProps> = ({ context }) => {
  const getBatteryColor = (level: number | null) => {
    if (!level) return 'text-gray-400';
    if (level < 0.2) return 'text-red-500';
    if (level < 0.5) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="flex items-center space-x-6 text-xs font-mono text-slate-400 select-none bg-slate-900/50 px-4 py-2 rounded-full backdrop-blur-md border border-slate-800">
      <div className="flex items-center space-x-2" title="System Clock">
        <Clock size={14} />
        <span>{context.currentTime.split(' ')[1]}</span> {/* Just show time */}
      </div>

      <div className="h-4 w-[1px] bg-slate-700" />

      <div className="flex items-center space-x-2" title="Connectivity">
        {context.isOnline ? <Wifi size={14} className="text-orion-highlight" /> : <WifiOff size={14} className="text-red-500" />}
        <span className={context.isOnline ? 'text-orion-highlight' : 'text-red-500'}>
          {context.isOnline ? 'NET_OK' : 'OFFLINE'}
        </span>
      </div>

      <div className="h-4 w-[1px] bg-slate-700" />

      <div className="flex items-center space-x-2" title="Power Cell">
        {context.isCharging ? <Zap size={14} className="text-yellow-400" /> : <Battery size={14} className={getBatteryColor(context.batteryLevel)} />}
        <span className={getBatteryColor(context.batteryLevel)}>
          {context.batteryLevel !== null ? `${(context.batteryLevel * 100).toFixed(0)}%` : '--'}
        </span>
      </div>
    </div>
  );
};

export default SystemHUD;
