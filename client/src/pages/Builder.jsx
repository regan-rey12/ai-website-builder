import Sidebar from '../components/shared/Sidebar';
import PromptInput from '../components/builder/PromptInput';
import LoadingScreen from '../components/builder/LoadingScreen';
import WebsiteRenderer from '../components/builder/WebsiteRenderer';
import ColorPicker from '../components/editor/ColorPicker';
import FontSelector from '../components/editor/FontSelector';
import { useWebsiteBuilder } from '../hooks/useWebsiteBuilder';
import './Builder.css';

function Builder() {
  const {
    prompt,
    setPrompt,
    loading,
    loadingMessage,
    error,
    website,
    generate,
    updateSettings,
  } = useWebsiteBuilder();

  return (
    <div className="builder-page">
      <Sidebar>
        <h1 className="brand">voidbuild</h1>
        {loading ? (
          <LoadingScreen message={loadingMessage} />
        ) : (
          <>
            <PromptInput
              prompt={prompt}
              onChange={setPrompt}
              onGenerate={generate}
              loading={loading}
              error={error}
            />
            {website && (
              <div className="editor-controls">
                <ColorPicker
                  color={website.settings?.primaryColor || '#2563eb'}
                  onChange={(primaryColor) => updateSettings({ primaryColor })}
                />
                <FontSelector
                  value={website.settings?.fontFamily || 'modern'}
                  onChange={(fontFamily) => updateSettings({ fontFamily })}
                />
              </div>
            )}
          </>
        )}
      </Sidebar>
      <main className="builder-preview">
        <WebsiteRenderer
          templateId={website?.templateId}
          content={website?.content}
          settings={website?.settings}
        />
      </main>
    </div>
  );
}


export default Builder;
