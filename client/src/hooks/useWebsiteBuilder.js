import { useState, useCallback } from 'react';
import { generateWebsite, updateWebsiteSettings } from '../services/api';

const LOADING_STEPS = [
  'Understanding your business...',
  'Crafting your content...',
  'Selecting best template...',
  'Building your website...',
  'Almost ready...',
];

export function useWebsiteBuilder() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');
  const [website, setWebsite] = useState(null);

  const generate = useCallback(async () => {
    if (!prompt.trim()) {
      setError('Describe your business (at least 10 characters).');
      return;
    }

    setLoading(true);
    setError('');
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2500);

    try {
      const result = await generateWebsite(prompt.trim());
      setWebsite({
        id: result.websiteId,
        templateId: result.templateId,
        content: result.content,
        settings: result.settings,
      });
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Generation failed. Check the server and try again.';
      setError(message);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }, [prompt]);

  const updateSettings = useCallback(
    async (partial) => {
      if (!website?.id) return;
      const nextSettings = { ...website.settings, ...partial };
      setWebsite((w) => ({ ...w, settings: nextSettings }));
      try {
        await updateWebsiteSettings(website.id, nextSettings);
      } catch {
        // keep local preview even if save fails
      }
    },
    [website]
  );

  return {
    prompt,
    setPrompt,
    loading,
    loadingStep,
    loadingMessage: LOADING_STEPS[loadingStep],
    error,
    website,
    generate,
    updateSettings,
  };
}
