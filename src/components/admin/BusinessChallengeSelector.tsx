import React, { useState, useEffect } from 'react';
import { 
  fetchBusinessChallenges, 
  type BusinessChallenge, 
  type SelectedBusinessChallenge 
} from '../../lib/businessChallenges';
import { 
  Target, 
  Search, 
  Check, 
  X, 
  Star, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Info 
} from 'lucide-react';

interface BusinessChallengeSelectorProps {
  selectedChallenges: SelectedBusinessChallenge[];
  onChange: (challenges: SelectedBusinessChallenge[]) => void;
  disabled?: boolean;
}

export const BusinessChallengeSelector: React.FC<BusinessChallengeSelectorProps> = ({
  selectedChallenges,
  onChange,
  disabled = false
}) => {
  const [availableChallenges, setAvailableChallenges] = useState<BusinessChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await fetchBusinessChallenges({ activeOnly: true });
      setAvailableChallenges(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const handleSelect = (challenge: BusinessChallenge) => {
    const isAlreadySelected = selectedChallenges.some(c => c.challengeId === challenge.id);
    if (isAlreadySelected) {
      handleRemove(challenge.id);
      return;
    }

    // If this is the very first challenge selected, make it primary automatically
    const isFirst = selectedChallenges.length === 0;
    const nextList: SelectedBusinessChallenge[] = [
      ...selectedChallenges,
      {
        challengeId: challenge.id,
        isPrimary: isFirst,
        challenge
      }
    ];

    onChange(nextList);
  };

  const handleRemove = (challengeId: string) => {
    const target = selectedChallenges.find(c => c.challengeId === challengeId);
    const nextList = selectedChallenges.filter(c => c.challengeId !== challengeId);

    // If the removed challenge was primary, promote the first remaining challenge to primary
    if (target?.isPrimary && nextList.length > 0) {
      nextList[0].isPrimary = true;
    }

    onChange(nextList);
  };

  const handleSetPrimary = (challengeId: string) => {
    const nextList = selectedChallenges.map(c => ({
      ...c,
      isPrimary: c.challengeId === challengeId
    }));
    onChange(nextList);
  };

  // Filter available challenges by search query
  const filteredAvailable = availableChallenges.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="bg-bg-primary/50 border border-border rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <label className="block text-sm font-semibold text-text-primary flex items-center gap-2">
            <Target size={18} className="text-accent" /> Business Challenges Addressed
          </label>
          <p className="text-xs text-text-secondary mt-0.5">
            Associate the specific strategic revenue challenge(s) this Insight article diagnoses or solves.
            Exactly one must be designated as the <span className="text-accent font-semibold">Primary Challenge</span>.
          </p>
        </div>

        {selectedChallenges.length > 0 && (
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
            {selectedChallenges.length} Selected
          </span>
        )}
      </div>

      {/* Selected Challenges Cards */}
      {selectedChallenges.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
            Assigned Challenges ({selectedChallenges.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedChallenges.map((item) => {
              const details = item.challenge || availableChallenges.find(c => c.id === item.challengeId);
              return (
                <div
                  key={item.challengeId}
                  className={`p-3 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    item.isPrimary
                      ? 'border-accent bg-accent/10 ring-1 ring-accent/30'
                      : 'border-border bg-bg-surface hover:border-text-secondary/40'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs text-text-primary truncate">
                        {details?.name || 'Unknown Challenge'}
                      </span>
                      {item.isPrimary ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-accent text-white shadow-sm shrink-0">
                          <Star size={10} className="fill-current" /> Primary
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(item.challengeId)}
                          disabled={disabled}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-border text-text-secondary hover:text-accent hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer shrink-0"
                          title="Set as Primary challenge"
                        >
                          <Star size={10} /> Make Primary
                        </button>
                      )}
                    </div>
                    {details?.description && (
                      <p className="text-[11px] text-text-secondary line-clamp-1">
                        {details.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.challengeId)}
                    disabled={disabled}
                    className="p-1 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer shrink-0"
                    title="Remove challenge"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-border bg-bg-primary/30 flex items-center gap-3 text-text-secondary text-xs">
          <Info size={16} className="text-accent shrink-0" />
          <span>No business challenges associated yet. Select one or more challenges below to optimize this article's discovery.</span>
        </div>
      )}

      {/* Multi-Select Dropdown / Picker */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || loading}
          className="w-full px-3.5 py-2.5 text-xs border border-border rounded-lg bg-bg-surface text-text-primary flex items-center justify-between hover:border-accent transition-colors cursor-pointer disabled:opacity-50"
        >
          <span className="flex items-center gap-2 text-text-secondary">
            <Search size={14} />
            {loading ? 'Loading active challenges...' : 'Click to search & select Business Challenges...'}
          </span>
          {isDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {isDropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-bg-surface border border-border rounded-xl shadow-2xl p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
            <div className="sticky top-0 bg-bg-surface pb-2 border-b border-border">
              <input
                type="text"
                autoFocus
                placeholder="Type to filter challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-border rounded-md bg-bg-primary text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              {filteredAvailable.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-secondary">
                  No matching active business challenges found.
                </div>
              ) : (
                filteredAvailable.map((challenge) => {
                  const isSelected = selectedChallenges.some(c => c.challengeId === challenge.id);
                  const isPrimary = selectedChallenges.some(c => c.challengeId === challenge.id && c.isPrimary);

                  return (
                    <div
                      key={challenge.id}
                      onClick={() => handleSelect(challenge)}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-accent/40 bg-accent/5 text-text-primary'
                          : 'border-transparent hover:bg-bg-primary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary flex items-center gap-2">
                          {challenge.name}
                          {isPrimary && (
                            <span className="text-[10px] bg-accent text-white px-1.5 py-0.2 rounded font-bold">
                              Primary
                            </span>
                          )}
                        </div>
                        {challenge.description && (
                          <div className="text-[11px] text-text-secondary/70 truncate mt-0.5">
                            {challenge.description}
                          </div>
                        )}
                      </div>

                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isSelected 
                          ? 'bg-accent border-accent text-white' 
                          : 'border-border bg-bg-primary'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
