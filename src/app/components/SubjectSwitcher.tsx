interface SubjectSwitcherProps {
  activeSubject: 'math' | 'russian';
  onSubjectChange: (subject: 'math' | 'russian') => void;
}

export function SubjectSwitcher({ activeSubject, onSubjectChange }: SubjectSwitcherProps) {
  return (
    <div className="px-4 py-3">
      <div className="bg-gray-100 rounded-full p-1 flex gap-1">
        <button
          onClick={() => onSubjectChange('math')}
          className={`flex-1 py-2.5 px-4 rounded-full font-bold transition-all ${
            activeSubject === 'math'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'text-gray-600'
          }`}
        >
          🔢 Математика
        </button>
        <button
          onClick={() => onSubjectChange('russian')}
          className={`flex-1 py-2.5 px-4 rounded-full font-bold transition-all ${
            activeSubject === 'russian'
              ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
              : 'text-gray-600'
          }`}
        >
          📚 Русский язык
        </button>
      </div>
    </div>
  );
}
