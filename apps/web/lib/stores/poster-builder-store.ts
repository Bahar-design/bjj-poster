import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type BeltRank = 'white' | 'blue' | 'purple' | 'brown' | 'black';

/** Form fields that can be set via setField (excludes athletePhoto and UI state) */
export type PosterFormField =
  | 'athleteName'
  | 'beltRank'
  | 'team'
  | 'tournament'
  | 'date'
  | 'location';

export interface PosterBuilderState {
  // Form data
  athletePhoto: File | null;
  athleteName: string;
  beltRank: BeltRank;
  team: string;
  tournament: string;
  date: string;
  location: string;
  selectedTemplateId: string | null;

  // UI state (not persisted)
  isGenerating: boolean;
  generationProgress: number;
  showAdvancedOptions: boolean;
  showPreview: boolean;
}

export interface PosterBuilderActions {
  setPhoto: (file: File | null) => void;
  /**
   * Updates a form field value. Use dedicated methods for UI state:
   * - setPhoto() for athletePhoto
   * - setTemplate() for selectedTemplateId
   * - setGenerating() for isGenerating/generationProgress
   * - toggleAdvancedOptions()/togglePreview() for UI toggles
   */
  setField: <K extends PosterFormField>(key: K, value: PosterBuilderState[K]) => void;
  setTemplate: (templateId: string | null) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
  toggleAdvancedOptions: () => void;
  togglePreview: () => void;
  reset: () => void;
}

export type PosterBuilderStore = PosterBuilderState & PosterBuilderActions;

const initialState: PosterBuilderState = {
  athletePhoto: null,
  athleteName: '',
  beltRank: 'white',
  team: '',
  tournament: '',
  date: '',
  location: '',
  selectedTemplateId: null,
  isGenerating: false,
  generationProgress: 0,
  showAdvancedOptions: false,
  showPreview: false,
};

export const usePosterBuilderStore = create<PosterBuilderStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setPhoto: (file) => set({ athletePhoto: file }),

        setField: (key, value) => set({ [key]: value }),

        setTemplate: (templateId) => set({ selectedTemplateId: templateId }),

        setGenerating: (isGenerating, progress) =>
          set({
            isGenerating,
            generationProgress: isGenerating ? (progress ?? 0) : 0,
          }),

        toggleAdvancedOptions: () =>
          set((state) => ({ showAdvancedOptions: !state.showAdvancedOptions })),

        togglePreview: () =>
          set((state) => ({ showPreview: !state.showPreview })),

        reset: () => set(initialState),
      }),
      {
        name: 'poster-builder-draft',
        partialize: (state) => ({
          athleteName: state.athleteName,
          beltRank: state.beltRank,
          team: state.team,
          tournament: state.tournament,
          date: state.date,
          location: state.location,
          selectedTemplateId: state.selectedTemplateId,
        }),
        // skipHydration prevents SSR mismatch in Next.js.
        // Call usePosterBuilderStore.persist.rehydrate() in a client component
        // (e.g., useEffect in app/layout.tsx or a dedicated StoreHydration component)
        skipHydration: true,
      }
    ),
    { name: 'PosterBuilderStore' }
  )
);
