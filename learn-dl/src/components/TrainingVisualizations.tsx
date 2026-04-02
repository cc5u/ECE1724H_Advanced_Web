import { useState } from "react";
import { Crosshair, Medal, Target, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartesianGrid, Legend, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MetricKey = "accuracy" | "precision" | "recall" | "f1_score";
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

export type AttentionVisualizationData = {
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
  legend: string[];
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
  { key: "accuracy", label: "Accuracy", icon: TrendingUp, iconClass: "text-blue-500" },
  { key: "precision", label: "Precision", icon: Target, iconClass: "text-green-500" },
  { key: "recall", label: "Recall", icon: Crosshair, iconClass: "text-violet-500" },
  { key: "f1_score", label: "F1-Score", icon: Medal, iconClass: "text-orange-500" },
];

const toPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
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
  const getClassTick = (index: number) => `C${index}`;
  const truncateLabel = (label: string, maxLength = 22) =>
    label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
  const cellClass =
    "min-h-16 rounded-xl flex items-center justify-center text-xl font-semibold transition-all duration-200 hover:scale-[1.02] px-2 py-3";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="mb-5 text-center text-3xl font-semibold text-slate-900">Confusion Matrix</h3>
      <div className="overflow-x-auto">
        <div
          className="mx-auto grid max-w-5xl gap-3"
          style={{ gridTemplateColumns: `minmax(180px, auto) repeat(${colCount}, minmax(64px, 1fr))` }}
        >
          <div className="text-center text-sm font-medium text-slate-600 py-2">Actual \ Predicted</div>
          {Array.from({ length: colCount }).map((_, colIdx) => (
            <div
              key={`col-header-${colIdx}`}
              className="text-center text-xs font-semibold text-slate-700 py-2"
              title={confusion.labels[colIdx] ?? `Class ${colIdx + 1}`}
            >
              {getClassTick(colIdx)}
            </div>
          ))}

          {Array.from({ length: rowCount }).map((_, rowIdx) => (
            <div key={`row-${rowIdx}`} className="contents">
              <div
                key={`row-header-${rowIdx}`}
                className="flex items-center justify-start text-sm font-medium text-slate-700 pl-1"
                title={confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`}
              >
                {getClassTick(rowIdx)} - {truncateLabel(confusion.labels[rowIdx] ?? `Class ${rowIdx + 1}`)}
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
      <div className="mt-4 rounded-md bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold text-slate-600">Class Index Legend</p>
        <div className="grid grid-cols-1 gap-1 text-xs text-slate-700 md:grid-cols-2">
          {confusion.labels.map((label, index) => (
            <div key={`legend-${index}`} className="truncate" title={label}>
              {getClassTick(index)}: {label}
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

export function AttentionPanel({ attention }: { attention: AttentionVisualizationData }) {
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
  const labels = embedding.legend.length > 0 ? embedding.legend : Array.from(new Set(embedding.points.map((point) => point.label)));
  const palette = [
    "#93C5FD",
    "#FCA5A5",
    "#86EFAC",
    "#C4B5FD",
    "#FCD34D",
    "#67E8F9",
    "#FDBA74",
    "#F9A8D4",
    "#A3E635",
    "#D8B4FE",
  ];
  const labelToColor = labels.reduce<Record<string, string>>((acc, label, index) => {
    acc[label] = palette[index % palette.length];
    return acc;
  }, {});

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
          const fill = labelToColor[point.label] ?? TRAIN_COLOR;
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
      <div className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {labels.map((label) => (
          <span key={label} className="flex items-center gap-2 text-slate-700">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: labelToColor[label] }} />
            {label}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-sm text-slate-600">{hoveredText ?? "Hover over points to see sample text."}</p>
    </div>
  );
}

export function TrainingVisualizations({ data }: { data?: TrainingVisualizationData | null }) {
  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-2xl font-semibold text-slate-900">Training Visualizations</h2>
        <div className="rounded-xl border border-dashed border-gray-300 bg-slate-50 p-10 text-center">
          <h3 className="text-lg font-medium text-slate-900">No Visualization Data</h3>
          <p className="mt-2 text-sm text-slate-600">
            This training session does not have stored visualization results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-semibold text-slate-900">Training Visualizations</h2>
      <Tabs defaultValue="metrics">
        <TabsList className="mb-6 grid h-14 w-full grid-cols-5 items-stretch gap-1 rounded-full bg-slate-100 p-1.5">
          <TabsTrigger
            value="metrics"
            className="h-full rounded-full border-0 px-4 py-0 text-sm leading-none after:hidden data-[state=active]:shadow-sm"
          >
            Metrics
          </TabsTrigger>
          <TabsTrigger
            value="confusion"
            className="h-full rounded-full border-0 px-4 py-0 text-sm leading-none after:hidden data-[state=active]:shadow-sm"
          >
            Confusion
          </TabsTrigger>
          <TabsTrigger
            value="learning"
            className="h-full rounded-full border-0 px-4 py-0 text-sm leading-none after:hidden data-[state=active]:shadow-sm"
          >
            Learning
          </TabsTrigger>
          <TabsTrigger
            value="attention"
            className="h-full rounded-full border-0 px-4 py-0 text-sm leading-none after:hidden data-[state=active]:shadow-sm"
          >
            Attention
          </TabsTrigger>
          <TabsTrigger
            value="embedding"
            className="h-full rounded-full border-0 px-4 py-0 text-sm leading-none after:hidden data-[state=active]:shadow-sm"
          >
            Embedding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics"><MetricsPanel metrics={data.metrics} /></TabsContent>
        <TabsContent value="confusion"><ConfusionPanel confusion={data.confusion_matrix} /></TabsContent>
        <TabsContent value="learning">
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
        </TabsContent>
        <TabsContent value="attention"><AttentionPanel attention={data.attention_visualization} /></TabsContent>
        <TabsContent value="embedding"><EmbeddingPanel embedding={data.embedding_2d} /></TabsContent>
      </Tabs>
    </div>
  );
}
