'use client';

import { useI18n } from '@/lib/i18n/context';
import { Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Languages } from 'lucide-react';

const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    // 약간의 지연을 두어 사용자가 드롭다운으로 이동할 시간을 줌
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (langCode: Language) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div 
      className="relative" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(e) => e.stopPropagation()}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        className="flex items-center gap-2 bg-background/80 backdrop-blur-sm"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLanguage?.nativeName}</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background/95 backdrop-blur-md border border-border z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={handleLanguageSelect(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                  language === lang.code ? 'bg-accent font-medium' : ''
                }`}
              >
                <span>{lang.nativeName}</span>
                {language === lang.code && (
                  <span className="text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

