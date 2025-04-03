import React, { useState, useEffect } from 'react';
import { CogIcon } from '@heroicons/react/24/solid';

interface SettingsProps {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  onSave: (settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    longBreakInterval: number;
  }) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  workDuration, 
  shortBreakDuration, 
  longBreakDuration, 
  onSave 
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState({
    workDuration: workDuration / 60, // Convert to minutes for display
    shortBreakDuration: shortBreakDuration / 60,
    longBreakDuration: longBreakDuration / 60,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    longBreakInterval: 4
  });

  // Update local settings when props change
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      workDuration: workDuration / 60,
      shortBreakDuration: shortBreakDuration / 60,
      longBreakDuration: longBreakDuration / 60,
    }));
  }, [workDuration, shortBreakDuration, longBreakDuration]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert minutes back to seconds for the app state
    onSave({
      ...settings,
      workDuration: settings.workDuration * 60,
      shortBreakDuration: settings.shortBreakDuration * 60,
      longBreakDuration: settings.longBreakDuration * 60
    });
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Open settings"
      >
        <CogIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Timer Settings</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pomodoro Duration (minutes)
                <input
                  type="number"
                  name="workDuration"
                  min="1"
                  max="60"
                  value={settings.workDuration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Short Break Duration (minutes)
                <input
                  type="number"
                  name="shortBreakDuration"
                  min="1"
                  max="30"
                  value={settings.shortBreakDuration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Long Break Duration (minutes)
                <input
                  type="number"
                  name="longBreakDuration"
                  min="1"
                  max="60"
                  value={settings.longBreakDuration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </label>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Long Break Interval (pomodoros)
                <input
                  type="number"
                  name="longBreakInterval"
                  min="1"
                  max="10"
                  value={settings.longBreakInterval}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoStartBreaks"
                checked={settings.autoStartBreaks}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Auto-start breaks
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="autoStartPomodoros"
                checked={settings.autoStartPomodoros}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700">
                Auto-start pomodoros
              </label>
            </div>
            
            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Settings; 