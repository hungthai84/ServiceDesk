
import React, { useState, useEffect } from 'react';
import { SunIcon, MapPinIcon } from './icons';
import { useLanguage } from './LanguageContext';

const WeatherClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [locationName, setLocationName] = useState<string>('Detecting location...');
  const { language } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchLocation = () => {
    if (navigator.geolocation) {
      setLocationName(language === 'vi' ? 'Đang xác định vị trí...' : 'Detecting location...');
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            if (!response.ok) {
              throw new Error('Failed to fetch location');
            }
            const data = await response.json();
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const country = data.address.country;
            
            if (city && country) {
              setLocationName(`${city}, ${country}`);
            } else if (country) {
              setLocationName(country);
            }
            else {
              setLocationName(language === 'vi' ? 'Không rõ vị trí' : 'Location unknown');
            }
          } catch {
            setLocationName(language === 'vi' ? 'Không thể lấy vị trí' : 'Location unavailable');
          }
        },
        (error: GeolocationPositionError) => {
          let userMessage;
          if (language === 'vi') {
            switch (error.code) {
              case 1: userMessage = 'Truy cập vị trí bị từ chối'; break;
              case 2: userMessage = 'Vị trí không khả dụng'; break;
              case 3: userMessage = 'Yêu cầu hết thời gian'; break;
              default: userMessage = 'Lỗi vị trí không xác định'; break;
            }
          } else {
            switch (error.code) {
              case 1: userMessage = 'Location access denied'; break;
              case 2: userMessage = 'Location unavailable'; break;
              case 3: userMessage = 'Location request timed out'; break;
              default: userMessage = 'An unknown location error occurred'; break;
            }
          }
          setLocationName(userMessage);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    } else {
      setLocationName(language === 'vi' ? 'Không hỗ trợ định vị' : 'Geolocation not supported');
    }
  };

  useEffect(() => {
    // We no longer fetch location automatically on mount to avoid immediate permission prompts.
    // The user can click to fetch it if needed.
    setLocationName(language === 'vi' ? 'Bấm để xem vị trí' : 'Click to see location');
  }, [language]);

  const formattedDate = currentTime.toLocaleDateString(language, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="flex items-center gap-4 text-sm text-[--color-text-secondary]">
      <div className="flex items-center gap-2">
        <SunIcon className="w-6 h-6 text-yellow-500" />
        <span className="font-medium">25°C</span>
      </div>
       <div className="h-8 w-px bg-[--color-border-secondary]"></div>
      <div className="text-right">
        <div className="font-semibold text-[--color-text-primary]">{formattedTime}</div>
        <div className="text-xs text-[--color-text-secondary] flex items-center justify-end gap-1.5">
            <span>{formattedDate}</span>
            <span className="opacity-50" aria-hidden="true">&bull;</span>
            <div 
                className="flex items-center gap-1 cursor-pointer hover:text-[--color-accent-500] transition-colors" 
                title={locationName}
                onClick={fetchLocation}
            >
                <MapPinIcon className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[150px]">{locationName}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherClock;
