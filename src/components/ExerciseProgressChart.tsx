import { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { styles } from '../styles';
import { Exercise, ExerciseRecord, ExerciseSetType } from '../types';
import { formatDate as formatLocalizedDate, t } from '../localization';

type ExerciseProgressChartProps = {
  exercise: Exercise;
  records: ExerciseRecord[];
  isLoading: boolean;
};

type ChartPoint = {
  timestamp: number;
  value: number;
};

type ChartSeries = {
  key: string;
  label: string;
  color: string;
  points: ChartPoint[];
};

type MetricConfig = {
  axisLabel: string;
  formatValue: (value: number) => string;
  lowerIsBetter?: boolean;
  series: ChartSeries[];
};

const SERIES_COLORS = [
  '#5AA7FF',
  '#C2410C',
  '#0F766E',
  '#7E22CE',
  '#FF7B7B',
  '#0E7490',
  '#A16207',
  '#B5BAC4',
];

const CHART_HEIGHT = 240;
const PADDING = { top: 18, right: 14, bottom: 42, left: 52 };
const TIMELINE_OPTIONS = [
  { key: '3M', months: 3 },
  { key: '6M', months: 6 },
  { key: '1Y', months: 12 },
  { key: 'All', months: null },
] as const;

type TimelineKey = (typeof TIMELINE_OPTIONS)[number]['key'];

export function ExerciseProgressChart({
  exercise,
  records,
  isLoading,
}: ExerciseProgressChartProps) {
  const [width, setWidth] = useState(320);
  const [timeline, setTimeline] = useState<TimelineKey>('All');
  const [hiddenSeriesKeys, setHiddenSeriesKeys] = useState<string[]>([]);
  const filteredRecords = useMemo(
    () => filterRecordsByTimeline(records, timeline),
    [records, timeline],
  );
  const metric = useMemo(
    () => buildMetricConfig(exercise.setType, filteredRecords),
    [exercise.setType, filteredRecords],
  );
  const visibleSeries = metric.series.filter(
    (series) => !hiddenSeriesKeys.includes(series.key),
  );
  const points = visibleSeries.flatMap((series) => series.points);

  useEffect(() => {
    const availableKeys = new Set(metric.series.map((series) => series.key));
    setHiddenSeriesKeys((current) => current.filter((key) => availableKeys.has(key)));
  }, [metric.series]);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(Math.max(260, event.nativeEvent.layout.width));
  };

  if (isLoading) {
    return (
      <View onLayout={onLayout} style={styles.progressChartEmpty}>
        <Text style={styles.emptyText}>{t('chart.loading')}</Text>
      </View>
    );
  }

  const timelineControls = (
    <View style={styles.progressChartTimeline}>
      {TIMELINE_OPTIONS.map((option) => {
        const isSelected = timeline === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => setTimeline(option.key)}
            style={[
              styles.progressChartTimelineButton,
              isSelected && styles.progressChartTimelineButtonSelected,
            ]}
          >
            <Text
              style={[
                styles.progressChartTimelineText,
                isSelected && styles.progressChartTimelineTextSelected,
              ]}
            >
              {option.key === 'All' ? t('chart.all') : option.key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (metric.series.length === 0) {
    return (
      <View onLayout={onLayout} style={styles.progressChart}>
        {timelineControls}
        <View style={styles.progressChartEmptyContent}>
          <Text style={styles.emptyText}>
            {records.length === 0
              ? t('chart.completeWorkout')
              : t('chart.noTimelineRecords')}
          </Text>
        </View>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View onLayout={onLayout} style={styles.progressChart}>
        {timelineControls}
        <View style={styles.progressChartEmptyContent}>
          <Text style={styles.emptyText}>{t('chart.enableLine')}</Text>
        </View>
        <ChartLegend
          hiddenSeriesKeys={hiddenSeriesKeys}
          series={metric.series}
          onToggleSeries={(key) =>
            setHiddenSeriesKeys((current) => current.filter((item) => item !== key))
          }
        />
      </View>
    );
  }

  const minTimestamp = Math.min(...points.map((point) => point.timestamp));
  const maxTimestamp = Math.max(...points.map((point) => point.timestamp));
  const values = points.map((point) => point.value);
  const rawMinValue = Math.min(...values);
  const rawMaxValue = Math.max(...values);
  const valuePadding = rawMinValue === rawMaxValue
    ? Math.max(Math.abs(rawMinValue) * 0.1, 1)
    : (rawMaxValue - rawMinValue) * 0.12;
  const minValue = Math.max(0, rawMinValue - valuePadding);
  const maxValue = rawMaxValue + valuePadding;
  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const x = (timestamp: number) =>
    PADDING.left +
    (maxTimestamp === minTimestamp
      ? plotWidth / 2
      : ((timestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * plotWidth);
  const y = (value: number) =>
    PADDING.top + ((maxValue - value) / (maxValue - minValue || 1)) * plotHeight;
  const yTicks = [0, 0.5, 1].map((ratio) => minValue + (maxValue - minValue) * ratio);
  const xTicks = buildDateTicks(minTimestamp, maxTimestamp);

  return (
    <View onLayout={onLayout} style={styles.progressChart}>
      {timelineControls}
      <View style={styles.progressChartHeading}>
        <Text style={styles.progressChartAxisLabel}>{metric.axisLabel}</Text>
        {metric.lowerIsBetter && (
          <Text style={styles.progressChartHint}>{t('chart.lowerBetter')}</Text>
        )}
      </View>
      <Svg height={CHART_HEIGHT} width={width}>
        <G>
          {yTicks.map((tick) => (
            <G key={tick}>
              <Line
                stroke="#353B4A"
                strokeWidth={1}
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y(tick)}
                y2={y(tick)}
              />
              <SvgText
                fill="#9BA1AD"
                fontSize={10}
                textAnchor="end"
                x={PADDING.left - 7}
                y={y(tick) + 3}
              >
                {metric.formatValue(tick)}
              </SvgText>
            </G>
          ))}
          <Line
            stroke="#6D7480"
            strokeWidth={1}
            x1={PADDING.left}
            x2={PADDING.left}
            y1={PADDING.top}
            y2={CHART_HEIGHT - PADDING.bottom}
          />
          <Line
            stroke="#6D7480"
            strokeWidth={1}
            x1={PADDING.left}
            x2={width - PADDING.right}
            y1={CHART_HEIGHT - PADDING.bottom}
            y2={CHART_HEIGHT - PADDING.bottom}
          />
          {xTicks.map((tick) => (
            <SvgText
              key={`${tick.timestamp}-${tick.label}`}
              fill="#9BA1AD"
              fontSize={10}
              textAnchor={tick.anchor}
              x={x(tick.timestamp)}
              y={CHART_HEIGHT - 18}
            >
              {tick.label}
            </SvgText>
          ))}
          {visibleSeries.map((series) => {
            const orderedPoints = [...series.points].sort(
              (left, right) => left.timestamp - right.timestamp,
            );
            const path = orderedPoints
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.timestamp)} ${y(point.value)}`)
              .join(' ');

            return (
              <G key={series.key}>
                {orderedPoints.length > 1 && (
                  <Path
                    d={path}
                    fill="none"
                    stroke={series.color}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                  />
                )}
                {orderedPoints.map((point, pointIndex) => (
                  <Circle
                    key={`${series.key}-point-${pointIndex}`}
                    cx={x(point.timestamp)}
                    cy={y(point.value)}
                    fill="#242936"
                    r={4}
                    stroke={series.color}
                    strokeWidth={2.5}
                  />
                ))}
              </G>
            );
          })}
        </G>
      </Svg>
      <ChartLegend
        hiddenSeriesKeys={hiddenSeriesKeys}
        series={metric.series}
        onToggleSeries={(key) =>
          setHiddenSeriesKeys((current) =>
            current.includes(key)
              ? current.filter((item) => item !== key)
              : [...current, key],
          )
        }
      />
    </View>
  );
}

function ChartLegend({
  hiddenSeriesKeys,
  series,
  onToggleSeries,
}: {
  hiddenSeriesKeys: string[];
  series: ChartSeries[];
  onToggleSeries: (key: string) => void;
}) {
  return (
    <View style={styles.progressChartLegend}>
      {series.map((item) => {
        const isHidden = hiddenSeriesKeys.includes(item.key);
        return (
          <Pressable
            key={item.key}
            accessibilityLabel={`${isHidden ? t('common.add') : t('common.remove')} ${item.label}`}
            accessibilityRole="button"
            onPress={() => onToggleSeries(item.key)}
            style={[
              styles.progressChartLegendItem,
              isHidden && styles.progressChartLegendItemHidden,
            ]}
          >
            <View
              style={[
                styles.progressChartLegendColor,
                { backgroundColor: item.color },
              ]}
            />
            <Text style={styles.progressChartLegendText}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function buildMetricConfig(
  setType: ExerciseSetType,
  records: ExerciseRecord[],
): MetricConfig {
  const orderedRecords = [...records].sort(
    (left, right) =>
      getRecordTimestamp(left) - getRecordTimestamp(right),
  );

  if (setType === 'Strength') {
    const pointsByReps = new Map<number, ChartPoint[]>();
    for (const record of orderedRecords) {
      const timestamp = getRecordTimestamp(record);
      const bestWeightByReps = new Map<number, number>();
      for (const set of record.sets) {
        if (set.reps === null || set.weight === null) {
          continue;
        }
        bestWeightByReps.set(
          set.reps,
          Math.max(bestWeightByReps.get(set.reps) ?? 0, set.weight),
        );
      }
      for (const [reps, weight] of bestWeightByReps) {
        pointsByReps.set(reps, [...(pointsByReps.get(reps) ?? []), { timestamp, value: weight }]);
      }
    }

    return {
      axisLabel: t('chart.weight'),
      formatValue: (value) => `${formatNumber(value)} kg`,
      series: [...pointsByReps.entries()]
        .sort(([left], [right]) => left - right)
        .map(([reps, seriesPoints], index) => ({
          key: `reps-${reps}`,
          label: `${reps} ${t(reps === 1 ? 'chart.rep' : 'chart.reps').toLowerCase()}`,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          points: seriesPoints,
        })),
    };
  }

  const createSingleSeries = (
    axisLabel: string,
    label: string,
    getValue: (record: ExerciseRecord) => number | null,
    formatValue: (value: number) => string,
    lowerIsBetter = false,
  ): MetricConfig => ({
    axisLabel,
    formatValue,
    lowerIsBetter,
    series: [{
      key: setType,
      label,
      color: SERIES_COLORS[0],
      points: orderedRecords.flatMap((record) => {
        const value = getValue(record);
        return value === null
          ? []
          : [{ timestamp: getRecordTimestamp(record), value }];
      }),
    }],
  });

  switch (setType) {
    case 'Duration':
      return createSingleSeries(
        t('chart.time'),
        t('chart.bestDuration'),
        (record) => maxOrNull(record.sets.map((set) => set.durationSeconds)),
        formatDuration,
      );
    case 'RepsOnly':
      return createSingleSeries(
        t('chart.reps'),
        t('chart.bestReps'),
        (record) => maxOrNull(record.sets.map((set) => set.reps)),
        (value) => formatNumber(value),
      );
    case 'Distance':
      return createSingleSeries(
        t('chart.distance'),
        t('chart.bestDistance'),
        (record) => {
          const meters = maxOrNull(record.sets.map((set) => set.distanceMeters));
          return meters === null ? null : meters / 1000;
        },
        (value) => `${formatNumber(value)} km`,
      );
    case 'DistanceDuration':
      return createSingleSeries(
        t('chart.pace'),
        t('chart.bestPace'),
        (record) => {
          const paces = record.sets.flatMap((set) =>
            set.durationSeconds !== null &&
            set.distanceMeters !== null &&
            set.distanceMeters > 0
              ? [set.durationSeconds / (set.distanceMeters / 1000)]
              : [],
          );
          return paces.length === 0 ? null : Math.min(...paces);
        },
        formatPace,
        true,
      );
  }
}

function maxOrNull(values: (number | null)[]) {
  const availableValues = values.filter((value): value is number => value !== null);
  return availableValues.length === 0 ? null : Math.max(...availableValues);
}

function filterRecordsByTimeline(records: ExerciseRecord[], timeline: TimelineKey) {
  const months = TIMELINE_OPTIONS.find((option) => option.key === timeline)?.months;
  if (months === null || months === undefined || records.length === 0) {
    return records;
  }

  const newestTimestamp = Math.max(...records.map(getRecordTimestamp));
  const cutoff = new Date(newestTimestamp);
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffTimestamp = cutoff.getTime();
  return records.filter((record) => getRecordTimestamp(record) >= cutoffTimestamp);
}

function getRecordTimestamp(record: ExerciseRecord) {
  const [year, month, day] = record.completedDateKey
    .split('-')
    .map((part) => Number(part));

  if (![year, month, day].every(Number.isFinite)) {
    return 0;
  }

  return new Date(year, month - 1, day).getTime();
}

function buildDateTicks(minTimestamp: number, maxTimestamp: number) {
  const formatDate = (timestamp: number) =>
    formatLocalizedDate(new Date(timestamp), { day: 'numeric', month: 'short' });

  if (minTimestamp === maxTimestamp) {
    return [{ timestamp: minTimestamp, label: formatDate(minTimestamp), anchor: 'middle' as const }];
  }

  const middleTimestamp = minTimestamp + (maxTimestamp - minTimestamp) / 2;
  return [
    { timestamp: minTimestamp, label: formatDate(minTimestamp), anchor: 'start' as const },
    { timestamp: middleTimestamp, label: formatDate(middleTimestamp), anchor: 'middle' as const },
    { timestamp: maxTimestamp, label: formatDate(maxTimestamp), anchor: 'end' as const },
  ];
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatDuration(value: number) {
  const roundedSeconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;
  return minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}s`;
}

function formatPace(value: number) {
  return `${formatDuration(value)}/km`;
}
