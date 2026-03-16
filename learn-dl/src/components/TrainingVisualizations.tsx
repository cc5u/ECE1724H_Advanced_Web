import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Crosshair, Medal, Target, TrendingUp } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MetricKey = "accuracy_pct" | "precision_pct" | "recall_pct" | "f1_score_pct";
type MetricsData = Record<MetricKey, number>;

type ConfusionMatrixData = {
  labels: string[];
  matrix: number[][];
  normalize: boolean;
};

type LearningCurvesData = {
  x: number[];
  train_loss: number[];
  val_loss: number[];
  train_acc: number[];
  val_acc: number[];
};

type AttentionVisualizationData = {
  text: string;
  tokens: string[];
  scores: number[];
};

type EmbeddingPoint = {
  x: number;
  y: number;
  label: string;
  text: string;
};

type Embedding2DData = {
  points: EmbeddingPoint[];
  legend: [string, string];
};

export type TrainingVisualizationData = {
  metrics: MetricsData;
  confusion_matrix: ConfusionMatrixData;
  learning_curves: LearningCurvesData;
  attention_visualization: AttentionVisualizationData;
  embedding_2d: Embedding2DData;
};

const metricCards: Array<{
  key: MetricKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
}> = [
  { key: "accuracy_pct", label: "Accuracy", icon: TrendingUp, iconClass: "text-blue-500" },
  { key: "precision_pct", label: "Precision", icon: Target, iconClass: "text-green-500" },
  { key: "recall_pct", label: "Recall", icon: Crosshair, iconClass: "text-violet-500" },
  { key: "f1_score_pct", label: "F1-Score", icon: Medal, iconClass: "text-orange-500" },
];

const toPercent = (value: number) => `${value.toFixed(1)}%`;
const lerp = (value: number, min: number, max: number) => (max === min ? 0 : (value - min) / (max - min));
const TRAIN_COLOR = "#93C5FD";
const VAL_COLOR = "#FCA5A5";

function MetricsPanel({ metrics }: { metrics: MetricsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metricCards.map(({ key, label, icon: Icon, iconClass }) => (
        <div key={key} className="rounded-xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{label}</span>
            <Icon className={`h-4 w-4 ${iconClass}`} />
          </div>
          <div className="mt-5 text-4xl font-semibold text-slate-900">{toPercent(metrics[key])}</div>
        </div>
      ))}
    </div>
  );
}

function ConfusionPanel({ confusion }: { confusion: ConfusionMatrixData }) {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const rowCount = confusion.matrix.length;
  const colCount = Math.max(0, ...confusion.matrix.map((row) => row.length));
  const flattenedValues = confusion.matrix.flat();
  const maxValue = flattenedValues.length > 0 ? Math.max(...flattenedValues) : 1;
  const alpha = (value: number) => 0.2 + (value / Math.max(1, maxValue)) * 0.75;
  const cellClass =
    "min-h-16 rounded-xl flex items-center justify-center text-xl font-semibold transition-all duration-200 hover:scale-[1.02] px-2 py-3";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid max-w-5xl gap-3"
          style={{ gridTemplateColumns: `minmax(140px, auto) repeat(${colCount}, minmax(72px, 1fr))` }}
        >
          <div className="text-center text-sm font-medium text-slate-600 py-2">Actual \ Predicted</div>
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <div key={`col-header-${colIdx}`} className="text-center text-sm font-medium text-slate-700 py-2">
              {confusion.labels[colIdx] ?? `Class ${colIdx + 1}`}
            </div>
          ))}

          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <div key={`row-header-${rowIdx}`} className="flex items-center justify-center text-sm font-medium text-slate-700">
                {confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`}
              </div>
              {Array.from({ length: colCount }).map((__, colIdx) => {
                const value = confusion.matrix[rowIdx]?.[colIdx] ?? 0;
                return (
                  <button
                    key={`cell-${rowIdx}-${colIdx}`}
                    type="button"
                    className={cellClass}
                    style={{
                      backgroundColor: `rgba(59,130,246,${alpha(value)})`,
                      color: value > maxValue * 0.55 ? "#fff" : "#0f172a",
                    }}
                    onMouseEnter={() =>
                      setHoveredCell(
                        `Actual: ${confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`} | Predicted: ${confusion.labels[colIdx] ?? `Class ${colIdx + 1}`} | Count: ${value}`,
                      )
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-slate-600">{hoveredCell ?? "Hover over a cell for details."}</p>
    </div>
  );
}

function LearningChart({
  title,
  data,
  trainKey,
  valKey,
  trainLabel,
  valLabel,
  yLabel,
  yDomain,
}: {
  title: string;
  data: Array<Record<string, number>>;
  trainKey: string;
  valKey: string;
  trainLabel: string;
  valLabel: string;
  yLabel: string;
  yDomain?: [number, number];
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h4 className="mb-3 text-xl font-semibold text-slate-900">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsLineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="epoch" />
          <YAxis
            domain={yDomain}
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
            tick={{ fill: "#475569", fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={trainKey}
            stroke={TRAIN_COLOR}
            strokeWidth={3}
            name={trainLabel}
            dot={{ r: 4, fill: "#fff", stroke: TRAIN_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            animationDuration={700}
          />
          <Line
            type="monotone"
            dataKey={valKey}
            stroke={VAL_COLOR}
            strokeWidth={3}
            name={valLabel}
            dot={{ r: 4, fill: "#fff", stroke: VAL_COLOR, strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            animationDuration={700}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttentionPanel({ attention }: { attention: AttentionVisualizationData }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxScore = Math.max(...attention.scores);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
      <h3 className="mb-5 text-3xl font-semibold text-slate-900">Attention Visualization</h3>
      <div className="rounded-xl bg-slate-50 p-6">
        <div className="flex flex-wrap justify-center gap-2">
          {attention.tokens.map((token, i) => {
            const intensity = maxScore === 0 ? 0 : attention.scores[i] / maxScore;
            return (
              <button
                type="button"
                key={`${token}-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="rounded-md px-3 py-2 transition-all duration-150 hover:-translate-y-0.5"
                style={{ backgroundColor: `rgba(59,130,246,${0.2 + intensity * 0.8})` }}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {hovered === null
          ? "Higher attention values indicate words that influenced the model prediction."
          : `Token "${attention.tokens[hovered]}" score: ${attention.scores[hovered].toFixed(2)}`}
      </p>
    </div>
  );
}

function EmbeddingPanel({ embedding }: { embedding: Embedding2DData }) {
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const width = 860;
  const height = 520;
  const p = { t: 24, r: 24, b: 64, l: 44 };
  const xs = embedding.points.map((point) => point.x);
  const ys = embedding.points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const [positiveLabel] = embedding.legend;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">2D Embedding Visualization</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {[0, 1, 2, 3, 4].map((k) => {
          const y = p.t + (k / 4) * (height - p.t - p.b);
          return <line key={`gy-${k}`} x1={p.l} y1={y} x2={width - p.r} y2={y} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}
        {[0, 1, 2, 3, 4].map((k) => {
          const x = p.l + (k / 4) * (width - p.l - p.r);
          return <line key={`gx-${k}`} x1={x} y1={p.t} x2={x} y2={height - p.b} stroke="#E5E7EB" strokeDasharray="4 8" />;
        })}

        {embedding.points.map((point, i) => {
          const cx = p.l + lerp(point.x, minX, maxX) * (width - p.l - p.r);
          const cy = height - p.b - lerp(point.y, minY, maxY) * (height - p.t - p.b);
          const isHovered = hoveredText === point.text;
          const fill = point.label === positiveLabel ? TRAIN_COLOR : VAL_COLOR;
          return (
            <circle
              key={`${point.text}-${i}`}
              cx={cx}
              cy={cy}
              r={isHovered ? 8 : 6}
              fill={fill}
              opacity={isHovered ? 1 : 0.7}
              onMouseEnter={() => setHoveredText(point.text)}
              onMouseLeave={() => setHoveredText(null)}
              className="transition-all duration-150"
            />
          );
        })}
      </svg>
      <div className="mt-3 flex justify-center gap-8 text-sm">
        <span className="flex items-center gap-2 text-blue-400"><span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: TRAIN_COLOR }} />Positive samples</span>
        <span className="flex items-center gap-2 text-red-400"><span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: VAL_COLOR }} />Negative samples</span>
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">{hoveredText ?? "Hover over points to see sample text."}</p>
    </div>
  );
}

export function TrainingVisualizations({ data }: { data: TrainingVisualizationData }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-semibold text-slate-900">Training Visualizations</h2>
      <Tabs.Root defaultValue="metrics">
        <Tabs.List className="mb-6 grid grid-cols-5 gap-1 rounded-full bg-slate-100 p-1">
          <Tabs.Trigger value="metrics" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Metrics</Tabs.Trigger>
          <Tabs.Trigger value="confusion" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Confusion</Tabs.Trigger>
          <Tabs.Trigger value="learning" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Learning</Tabs.Trigger>
          <Tabs.Trigger value="attention" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Attention</Tabs.Trigger>
          <Tabs.Trigger value="embedding" className="rounded-full px-4 py-2 text-sm data-[state=active]:bg-white data-[state=active]:shadow">Embedding</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="metrics"><MetricsPanel metrics={data.metrics} /></Tabs.Content>
        <Tabs.Content value="confusion"><ConfusionPanel confusion={data.confusion_matrix} /></Tabs.Content>
        <Tabs.Content value="learning">
          <div className="space-y-5">
            <LearningChart
              title="Training & Validation Loss"
              data={data.learning_curves.x.map((epoch, index) => ({
                epoch,
                trainLoss: data.learning_curves.train_loss[index],
                valLoss: data.learning_curves.val_loss[index],
              }))}
              trainKey="trainLoss"
              valKey="valLoss"
              trainLabel="Training Loss"
              valLabel="Validation Loss"
              yLabel="Loss"
            />
            <LearningChart
              title="Training & Validation Accuracy"
              data={data.learning_curves.x.map((epoch, index) => ({
                epoch,
                trainAcc: data.learning_curves.train_acc[index] * 100,
                valAcc: data.learning_curves.val_acc[index] * 100,
              }))}
              trainKey="trainAcc"
              valKey="valAcc"
              trainLabel="Training Accuracy"
              valLabel="Validation Accuracy"
              yLabel="Accuracy (%)"
              yDomain={[0, 100]}
            />
          </div>
        </Tabs.Content>
        <Tabs.Content value="attention"><AttentionPanel attention={data.attention_visualization} /></Tabs.Content>
        <Tabs.Content value="embedding"><EmbeddingPanel embedding={data.embedding_2d} /></Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
