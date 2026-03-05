import * as Tabs from "@radix-ui/react-tabs";

type TrainingResultProps = {
  hasResults: boolean;
};

export function TrainingResult({ hasResults }: TrainingResultProps) {
  if (!hasResults) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-2xl mb-6">Results</h2>

      <Tabs.Root defaultValue="metrics">
        <Tabs.List className="flex gap-2 border-b border-gray-200 mb-6">
          <Tabs.Trigger
            value="metrics"
            className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
          >
            Metrics
          </Tabs.Trigger>
          <Tabs.Trigger
            value="confusion"
            className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
          >
            Confusion Matrix
          </Tabs.Trigger>
          <Tabs.Trigger
            value="curve"
            className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
          >
            Learning Curve
          </Tabs.Trigger>
          <Tabs.Trigger
            value="attention"
            className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
          >
            Attention
          </Tabs.Trigger>
          <Tabs.Trigger
            value="embeddings"
            className="px-4 py-2 text-sm data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 -mb-px"
          >
            Embeddings
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metrics">
          <h1 className="text-xl font-semibold mb-4">Evaluation Metrics</h1>
        </Tabs.Content>

        <Tabs.Content value="confusion">
          <h1 className="text-xl font-semibold mb-4">Confusion Matrix</h1>
        </Tabs.Content>

        <Tabs.Content value="curve">
          <h1 className="text-xl font-semibold mb-4">Learning Curve</h1>
        </Tabs.Content>

        <Tabs.Content value="attention">
          <h1 className="text-xl font-semibold mb-4">Attention View</h1>
        </Tabs.Content>
        <Tabs.Content value="embeddings">
          <h1 className="text-xl font-semibold mb-4">Embedding View</h1>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
