# GGRAS Development Plan: AI Developer 1 (AI-1)

## Role Overview

| Attribute | Details |
|-----------|---------|
| **Role** | AI/ML Developer |
| **ID** | AI-1 |
| **Duration** | 12 Weeks (3 Months) |
| **Primary Focus** | Anomaly Detection, Feature Engineering, Predictive Analytics |
| **Secondary Focus** | Model Training Pipeline, ML Infrastructure, Data Preprocessing |
| **Tech Stack** | Python, PyTorch/TensorFlow, FastAPI, MLflow, PostgreSQL, TimescaleDB |

---

## Microservices Architecture Alignment

**Deployment Model:** Kubernetes + standard service mesh (Istio/Linkerd).

**Service Ownership (AI-1):**
- ml-anomaly-service (detection, scoring)
- feature-store-service (feature computation/serving)
- model-training-service (pipelines, tracking)
- model-serving-service (inference APIs)

**Integration:** Consumes event streams and writes scores to reporting-service via internal APIs.


## Core Responsibilities

1. **Anomaly Detection Models** - Under-reporting, payout spikes, feed drops
2. **Feature Engineering** - Rolling aggregations, payout ratios, temporal features
3. **Feature Store** - Feature computation and serving infrastructure
4. **Predictive Analytics** - GGR forecasting, tax revenue prediction
5. **ML Training Pipeline** - Model training, validation, versioning
6. **Data Preprocessing** - Data cleaning, normalization, transformation
7. **Model Serving** - FastAPI inference endpoints
8. **LSTM Sequence Models** - Time-series anomaly detection

---

## Module Ownership

| Module | Role | Priority |
|--------|------|----------|
| Anomaly Detection | Primary | Critical |
| Feature Engineering | Primary | Critical |
| Feature Store | Primary | High |
| Predictive Analytics | Primary | High |
| ML Training Pipeline | Primary | High |
| Data Preprocessing | Primary | High |
| Model Serving API | Primary | High |
| LSTM Sequence Models | Primary | Medium |
| Risk Scoring | Secondary (AI-2 Primary) | Medium |

---

# Phase 1: Foundation (Weeks 1-4)

## Week 1: ML Infrastructure Setup

### Weekly Milestone
- [ ] ML project structure established
- [ ] Development environment configured
- [ ] MLflow tracking server operational
- [ ] Database connections verified
- [ ] Initial data exploration complete

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Initialize Python ML project structure | Critical | 2h | `apps/ml/` scaffold |
| Configure Poetry/pip dependencies | Critical | 1h | `pyproject.toml` |
| Set up virtual environment | Critical | 30m | venv configured |
| Configure linting (black, isort, flake8) | High | 1h | Linting config |
| Set up pre-commit hooks | Medium | 30m | Pre-commit config |
| Create project README | Medium | 1h | Documentation |

**Project Structure:**
```
apps/ml/
├── src/
│   ├── __init__.py
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py
│   │   └── logging.py
│   ├── data/
│   │   ├── __init__.py
│   │   ├── connectors.py
│   │   ├── preprocessing.py
│   │   └── loaders.py
│   ├── features/
│   │   ├── __init__.py
│   │   ├── engineering.py
│   │   └── store.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── anomaly/
│   │   │   ├── statistical.py
│   │   │   ├── isolation_forest.py
│   │   │   └── lstm.py
│   │   └── forecasting/
│   │       └── prophet.py
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py
│   │   └── evaluator.py
│   ├── serving/
│   │   ├── __init__.py
│   │   ├── api.py
│   │   └── schemas.py
│   └── utils/
│       ├── __init__.py
│       └── metrics.py
├── notebooks/
│   └── exploration/
├── tests/
├── mlruns/
└── pyproject.toml
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Set up MLflow tracking server | Critical | 3h | MLflow operational |
| Configure MLflow artifact store (S3/local) | Critical | 2h | Artifact storage |
| Create experiment tracking utilities | High | 2h | Tracking utils |
| Document MLflow usage | Medium | 1h | MLflow docs |

**MLflow Configuration:**
```python
# src/config/mlflow_config.py
import mlflow
from mlflow.tracking import MlflowClient

def setup_mlflow():
    mlflow.set_tracking_uri(os.getenv("MLFLOW_TRACKING_URI", "http://localhost:5000"))
    mlflow.set_experiment("ggras-anomaly-detection")

def log_model_metrics(metrics: dict, model_name: str, version: str):
    with mlflow.start_run(run_name=f"{model_name}-{version}"):
        mlflow.log_params({
            "model_name": model_name,
            "version": version
        })
        mlflow.log_metrics(metrics)

def register_model(model, model_name: str, metrics: dict):
    with mlflow.start_run():
        mlflow.sklearn.log_model(model, model_name)
        mlflow.log_metrics(metrics)
        mlflow.register_model(
            f"runs:/{mlflow.active_run().info.run_id}/{model_name}",
            model_name
        )
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create database connection module | Critical | 2h | DB connector |
| Set up TimescaleDB queries | Critical | 2h | Time-series queries |
| Build data loading utilities | High | 2h | Data loaders |
| Create data validation schemas | High | 2h | Pydantic schemas |

**Database Connector:**
```python
# src/data/connectors.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pandas as pd

class DatabaseConnector:
    def __init__(self, connection_string: str):
        self.engine = create_engine(connection_string)
        self.Session = sessionmaker(bind=self.engine)

    def fetch_events(
        self,
        start_date: datetime,
        end_date: datetime,
        operator_id: str = None
    ) -> pd.DataFrame:
        query = """
        SELECT
            event_id,
            operator_id,
            event_type,
            amount,
            currency,
            game_type,
            event_timestamp,
            sequence_number
        FROM raw_events
        WHERE event_timestamp BETWEEN :start AND :end
        """
        if operator_id:
            query += " AND operator_id = :operator_id"

        return pd.read_sql(
            query,
            self.engine,
            params={
                "start": start_date,
                "end": end_date,
                "operator_id": operator_id
            }
        )

    def fetch_aggregated_metrics(
        self,
        period: str = 'hourly'
    ) -> pd.DataFrame:
        time_bucket = '1 hour' if period == 'hourly' else '1 day'
        query = f"""
        SELECT
            time_bucket('{time_bucket}', event_timestamp) AS period,
            operator_id,
            game_type,
            SUM(CASE WHEN event_type = 'stake' THEN amount ELSE 0 END) as stakes,
            SUM(CASE WHEN event_type = 'payout' THEN amount ELSE 0 END) as payouts,
            SUM(CASE WHEN event_type = 'refund' THEN amount ELSE 0 END) as refunds,
            COUNT(*) as event_count
        FROM raw_events
        GROUP BY period, operator_id, game_type
        ORDER BY period
        """
        return pd.read_sql(query, self.engine)
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Initial data exploration notebook | Critical | 3h | EDA notebook |
| Analyze event distributions | High | 2h | Distribution analysis |
| Identify data quality issues | High | 2h | Data quality report |
| Document data characteristics | Medium | 1h | Data documentation |

**EDA Notebook Structure:**
```python
# notebooks/exploration/01_data_exploration.ipynb

# 1. Load sample data
# 2. Basic statistics
#    - Event counts by type
#    - Amount distributions
#    - Temporal patterns
# 3. Operator analysis
#    - Activity patterns
#    - GGR distributions
# 4. Anomaly indicators
#    - Payout ratio analysis
#    - Event frequency patterns
#    - Gap detection
# 5. Feature correlation analysis
# 6. Data quality assessment
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create synthetic data generator | High | 3h | Data generator |
| Generate test datasets | High | 2h | Test data |
| Write initial unit tests | High | 2h | Test coverage |
| Create PR and documentation | High | 1h | PR submitted |

---

## Week 2: Feature Engineering Foundation

### Weekly Milestone
- [ ] Core feature engineering pipeline
- [ ] Rolling window aggregations
- [ ] Payout ratio features
- [ ] Temporal features extracted
- [ ] Feature validation implemented

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design feature engineering architecture | Critical | 2h | Architecture doc |
| Create base feature transformer class | Critical | 2h | Base class |
| Implement rolling window utilities | Critical | 3h | Rolling windows |
| Add window size configuration | High | 1h | Configuration |

**Feature Engineering Architecture:**
```python
# src/features/engineering.py
from abc import ABC, abstractmethod
import pandas as pd
from typing import List

class FeatureTransformer(ABC):
    """Base class for feature transformers"""

    @abstractmethod
    def fit(self, df: pd.DataFrame) -> 'FeatureTransformer':
        pass

    @abstractmethod
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        pass

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.fit(df).transform(df)


class RollingWindowFeatures(FeatureTransformer):
    """Compute rolling window aggregations"""

    def __init__(
        self,
        windows: List[str] = ['1H', '24H', '7D'],
        metrics: List[str] = ['stakes', 'payouts', 'event_count'],
        aggregations: List[str] = ['sum', 'mean', 'std', 'min', 'max']
    ):
        self.windows = windows
        self.metrics = metrics
        self.aggregations = aggregations

    def fit(self, df: pd.DataFrame) -> 'RollingWindowFeatures':
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.set_index('event_timestamp').sort_index()

        for window in self.windows:
            for metric in self.metrics:
                for agg in self.aggregations:
                    col_name = f"{metric}_{window}_{agg}"
                    df[col_name] = df[metric].rolling(window).agg(agg)

        return df.reset_index()
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement payout ratio features | Critical | 3h | Payout features |
| Create GGR margin calculations | Critical | 2h | GGR features |
| Add ratio trend features | High | 2h | Trend features |
| Implement z-score normalization | High | 1h | Normalization |

**Payout Ratio Features:**
```python
# src/features/payout_features.py
class PayoutRatioFeatures(FeatureTransformer):
    """Calculate payout-related features"""

    def __init__(self, windows: List[str] = ['1H', '24H', '7D']):
        self.windows = windows

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        # Basic payout ratio
        df['payout_ratio'] = df['payouts'] / (df['stakes'] + 1e-10)

        # GGR margin
        df['ggr_margin'] = (df['stakes'] - df['payouts'] - df['refunds']) / (df['stakes'] + 1e-10)

        # Rolling payout ratios
        for window in self.windows:
            df[f'payout_ratio_{window}'] = (
                df['payouts'].rolling(window).sum() /
                (df['stakes'].rolling(window).sum() + 1e-10)
            )

            # Payout ratio deviation from rolling mean
            rolling_mean = df['payout_ratio'].rolling(window).mean()
            rolling_std = df['payout_ratio'].rolling(window).std()
            df[f'payout_ratio_{window}_zscore'] = (
                (df['payout_ratio'] - rolling_mean) / (rolling_std + 1e-10)
            )

        return df
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement temporal features | Critical | 3h | Temporal features |
| Add hour-of-day encoding | High | 1.5h | Hour encoding |
| Add day-of-week encoding | High | 1.5h | Day encoding |
| Create seasonality features | Medium | 2h | Seasonality |

**Temporal Features:**
```python
# src/features/temporal_features.py
class TemporalFeatures(FeatureTransformer):
    """Extract temporal features from timestamps"""

    def __init__(self, cyclical: bool = True):
        self.cyclical = cyclical

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        ts = pd.to_datetime(df['event_timestamp'])

        # Basic temporal
        df['hour'] = ts.dt.hour
        df['day_of_week'] = ts.dt.dayofweek
        df['day_of_month'] = ts.dt.day
        df['month'] = ts.dt.month
        df['is_weekend'] = ts.dt.dayofweek >= 5

        if self.cyclical:
            # Cyclical encoding for hour
            df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
            df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)

            # Cyclical encoding for day of week
            df['dow_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
            df['dow_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)

            # Cyclical encoding for month
            df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
            df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)

        return df
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement operator comparison features | High | 2h | Operator features |
| Create industry baseline features | High | 2h | Baseline features |
| Add relative performance metrics | High | 2h | Performance metrics |
| Implement feature validation | High | 2h | Validation |

**Operator Comparison Features:**
```python
# src/features/operator_features.py
class OperatorComparisonFeatures(FeatureTransformer):
    """Compare operator metrics against industry baselines"""

    def __init__(self, baseline_window: str = '30D'):
        self.baseline_window = baseline_window
        self.industry_stats = {}

    def fit(self, df: pd.DataFrame) -> 'OperatorComparisonFeatures':
        # Calculate industry-wide statistics
        self.industry_stats = {
            'mean_ggr_margin': df.groupby('game_type')['ggr_margin'].mean().to_dict(),
            'mean_payout_ratio': df.groupby('game_type')['payout_ratio'].mean().to_dict(),
            'mean_event_frequency': df.groupby('game_type')['event_count'].mean().to_dict()
        }
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        # Deviation from industry average
        df['ggr_margin_vs_industry'] = df.apply(
            lambda x: x['ggr_margin'] - self.industry_stats['mean_ggr_margin'].get(x['game_type'], 0),
            axis=1
        )

        df['payout_ratio_vs_industry'] = df.apply(
            lambda x: x['payout_ratio'] - self.industry_stats['mean_payout_ratio'].get(x['game_type'], 0),
            axis=1
        )

        return df
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create feature pipeline orchestrator | High | 3h | Pipeline orchestrator |
| Write feature engineering tests | High | 2h | Tests |
| Document feature definitions | Medium | 2h | Feature docs |
| Create PR | High | 1h | PR submitted |

---

## Week 3: Statistical Anomaly Detection

### Weekly Milestone
- [ ] Benford's Law implementation
- [ ] Statistical baseline detection
- [ ] Z-score anomaly detection
- [ ] Ensemble statistical methods
- [ ] Anomaly scoring system

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement Benford's Law analysis | Critical | 3h | Benford detector |
| Create digit distribution analyzer | High | 2h | Digit analysis |
| Add chi-square test for conformity | High | 2h | Statistical test |
| Document Benford's methodology | Medium | 1h | Documentation |

**Benford's Law Implementation:**
```python
# src/models/anomaly/statistical.py
import numpy as np
from scipy import stats

class BenfordsLawDetector:
    """
    Detect anomalies using Benford's Law.
    Natural datasets follow specific digit distributions.
    Gaming revenue should conform to Benford's Law.
    """

    # Expected first digit distribution (Benford's Law)
    EXPECTED_DISTRIBUTION = {
        1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097,
        5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
    }

    def __init__(self, significance_level: float = 0.05):
        self.significance_level = significance_level

    def get_first_digits(self, values: np.ndarray) -> np.ndarray:
        """Extract first digit from each value"""
        abs_values = np.abs(values[values > 0])
        return np.array([
            int(str(v).lstrip('0').lstrip('.')[0])
            for v in abs_values if str(v).lstrip('0').lstrip('.')[0].isdigit()
        ])

    def calculate_observed_distribution(self, values: np.ndarray) -> dict:
        """Calculate observed first digit distribution"""
        first_digits = self.get_first_digits(values)
        total = len(first_digits)

        return {
            d: np.sum(first_digits == d) / total
            for d in range(1, 10)
        }

    def chi_square_test(self, values: np.ndarray) -> dict:
        """Perform chi-square goodness-of-fit test"""
        first_digits = self.get_first_digits(values)
        observed = np.array([np.sum(first_digits == d) for d in range(1, 10)])
        expected = np.array([
            self.EXPECTED_DISTRIBUTION[d] * len(first_digits)
            for d in range(1, 10)
        ])

        chi2, p_value = stats.chisquare(observed, expected)

        return {
            'chi_square': chi2,
            'p_value': p_value,
            'is_anomaly': p_value < self.significance_level,
            'observed_distribution': self.calculate_observed_distribution(values),
            'expected_distribution': self.EXPECTED_DISTRIBUTION
        }

    def detect(self, df: pd.DataFrame, column: str = 'amount') -> dict:
        """Run Benford's Law detection on a column"""
        return self.chi_square_test(df[column].values)
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement baseline deviation detector | Critical | 3h | Baseline detector |
| Create adaptive threshold system | High | 2h | Thresholds |
| Add rolling baseline computation | High | 2h | Rolling baseline |
| Implement sensitivity configuration | Medium | 1h | Configuration |

**Baseline Deviation Detector:**
```python
# src/models/anomaly/statistical.py
class BaselineDeviationDetector:
    """
    Detect anomalies based on deviation from historical baseline.
    Flags operators whose metrics deviate significantly from their own history.
    """

    def __init__(
        self,
        baseline_window: int = 30,  # days
        z_threshold: float = 3.0,
        min_samples: int = 100
    ):
        self.baseline_window = baseline_window
        self.z_threshold = z_threshold
        self.min_samples = min_samples
        self.baselines = {}

    def fit(self, df: pd.DataFrame, operator_id: str) -> 'BaselineDeviationDetector':
        """Calculate baseline statistics for an operator"""
        operator_data = df[df['operator_id'] == operator_id]

        if len(operator_data) < self.min_samples:
            raise ValueError(f"Insufficient data for operator {operator_id}")

        self.baselines[operator_id] = {
            'ggr_mean': operator_data['ggr'].mean(),
            'ggr_std': operator_data['ggr'].std(),
            'payout_ratio_mean': operator_data['payout_ratio'].mean(),
            'payout_ratio_std': operator_data['payout_ratio'].std(),
            'event_count_mean': operator_data['event_count'].mean(),
            'event_count_std': operator_data['event_count'].std()
        }

        return self

    def detect(self, current_metrics: dict, operator_id: str) -> dict:
        """Detect anomalies in current metrics against baseline"""
        if operator_id not in self.baselines:
            return {'error': 'No baseline for operator'}

        baseline = self.baselines[operator_id]
        anomalies = []

        # Check GGR deviation
        ggr_zscore = (current_metrics['ggr'] - baseline['ggr_mean']) / (baseline['ggr_std'] + 1e-10)
        if abs(ggr_zscore) > self.z_threshold:
            anomalies.append({
                'metric': 'ggr',
                'zscore': ggr_zscore,
                'direction': 'high' if ggr_zscore > 0 else 'low',
                'severity': self._calculate_severity(abs(ggr_zscore))
            })

        # Check payout ratio deviation
        pr_zscore = (
            current_metrics['payout_ratio'] - baseline['payout_ratio_mean']
        ) / (baseline['payout_ratio_std'] + 1e-10)
        if abs(pr_zscore) > self.z_threshold:
            anomalies.append({
                'metric': 'payout_ratio',
                'zscore': pr_zscore,
                'direction': 'high' if pr_zscore > 0 else 'low',
                'severity': self._calculate_severity(abs(pr_zscore))
            })

        return {
            'operator_id': operator_id,
            'anomalies': anomalies,
            'is_anomaly': len(anomalies) > 0,
            'anomaly_count': len(anomalies)
        }

    def _calculate_severity(self, zscore: float) -> str:
        if zscore > 5:
            return 'critical'
        elif zscore > 4:
            return 'high'
        elif zscore > 3:
            return 'medium'
        return 'low'
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement payout spike detector | Critical | 3h | Spike detector |
| Create sudden change detection | High | 2h | Change detection |
| Add consecutive anomaly tracking | High | 2h | Streak detection |
| Implement alert aggregation | Medium | 1h | Aggregation |

**Payout Spike Detector:**
```python
# src/models/anomaly/statistical.py
class PayoutSpikeDetector:
    """
    Detect sudden spikes in payout ratios that may indicate fraud.
    """

    def __init__(
        self,
        spike_threshold: float = 2.0,  # multiplier over rolling average
        rolling_window: str = '24H',
        min_stake_threshold: float = 1000
    ):
        self.spike_threshold = spike_threshold
        self.rolling_window = rolling_window
        self.min_stake_threshold = min_stake_threshold

    def detect(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect payout spikes in time series data"""
        df = df.sort_values('event_timestamp')

        # Calculate rolling payout ratio
        df['rolling_payout_ratio'] = (
            df['payouts'].rolling(self.rolling_window).sum() /
            (df['stakes'].rolling(self.rolling_window).sum() + 1e-10)
        )

        # Current vs rolling
        df['payout_ratio_spike'] = df['payout_ratio'] / (df['rolling_payout_ratio'] + 1e-10)

        # Flag spikes
        df['is_spike'] = (
            (df['payout_ratio_spike'] > self.spike_threshold) &
            (df['stakes'] > self.min_stake_threshold)
        )

        return df[df['is_spike']][['event_timestamp', 'operator_id', 'payout_ratio', 'payout_ratio_spike']]
```

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement feed drop detector | Critical | 3h | Feed drop detector |
| Create event frequency monitoring | High | 2h | Frequency monitor |
| Add gap detection algorithm | High | 2h | Gap detection |
| Implement real-time detection | Medium | 1h | Real-time |

**Feed Drop Detector:**
```python
# src/models/anomaly/statistical.py
class FeedDropDetector:
    """
    Detect when operators stop or significantly reduce event submission.
    May indicate technical issues or deliberate data withholding.
    """

    def __init__(
        self,
        expected_frequency_minutes: int = 5,
        drop_threshold: float = 0.1,  # 90% drop
        lookback_hours: int = 24
    ):
        self.expected_frequency_minutes = expected_frequency_minutes
        self.drop_threshold = drop_threshold
        self.lookback_hours = lookback_hours

    def calculate_event_frequency(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate hourly event frequency per operator"""
        df['hour'] = df['event_timestamp'].dt.floor('H')

        frequency = df.groupby(['operator_id', 'hour']).agg({
            'event_id': 'count'
        }).rename(columns={'event_id': 'event_count'}).reset_index()

        return frequency

    def detect_drops(self, df: pd.DataFrame) -> List[dict]:
        """Detect significant drops in event frequency"""
        frequency = self.calculate_event_frequency(df)
        drops = []

        for operator_id in frequency['operator_id'].unique():
            op_freq = frequency[frequency['operator_id'] == operator_id].sort_values('hour')

            # Calculate rolling baseline
            op_freq['rolling_mean'] = op_freq['event_count'].rolling(
                window=self.lookback_hours, min_periods=6
            ).mean()

            # Detect drops
            op_freq['drop_ratio'] = op_freq['event_count'] / (op_freq['rolling_mean'] + 1)

            drop_periods = op_freq[op_freq['drop_ratio'] < self.drop_threshold]

            for _, row in drop_periods.iterrows():
                drops.append({
                    'operator_id': operator_id,
                    'timestamp': row['hour'],
                    'event_count': row['event_count'],
                    'expected_count': row['rolling_mean'],
                    'drop_ratio': row['drop_ratio'],
                    'severity': 'critical' if row['drop_ratio'] < 0.01 else 'high'
                })

        return drops
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create ensemble statistical detector | High | 3h | Ensemble |
| Write comprehensive tests | High | 2h | Tests |
| Document detection methods | Medium | 2h | Documentation |
| Create PR | High | 1h | PR submitted |

---

## Week 4: ML-Based Anomaly Detection

### Weekly Milestone
- [ ] Isolation Forest implementation
- [ ] LSTM sequence model for anomalies
- [ ] Model training pipeline
- [ ] Model evaluation framework
- [ ] Phase 1 demo ready

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement Isolation Forest model | Critical | 3h | Isolation Forest |
| Create feature preprocessing pipeline | High | 2h | Preprocessing |
| Add contamination parameter tuning | High | 2h | Hyperparameter tuning |
| Implement model persistence | Medium | 1h | Model saving |

**Isolation Forest Implementation:**
```python
# src/models/anomaly/isolation_forest.py
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

class IsolationForestAnomalyDetector:
    """
    Isolation Forest for detecting anomalous operator behavior.
    Effective for high-dimensional data with complex patterns.
    """

    def __init__(
        self,
        contamination: float = 0.05,
        n_estimators: int = 100,
        max_samples: str = 'auto',
        random_state: int = 42
    ):
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.max_samples = max_samples
        self.random_state = random_state

        self.scaler = StandardScaler()
        self.model = IsolationForest(
            contamination=contamination,
            n_estimators=n_estimators,
            max_samples=max_samples,
            random_state=random_state,
            n_jobs=-1
        )
        self.feature_columns = None

    def fit(self, df: pd.DataFrame, feature_columns: List[str]) -> 'IsolationForestAnomalyDetector':
        """Train the Isolation Forest model"""
        self.feature_columns = feature_columns
        X = df[feature_columns].values

        # Scale features
        X_scaled = self.scaler.fit_transform(X)

        # Fit model
        self.model.fit(X_scaled)

        # Log to MLflow
        with mlflow.start_run(run_name="isolation_forest_training"):
            mlflow.log_params({
                "contamination": self.contamination,
                "n_estimators": self.n_estimators,
                "n_features": len(feature_columns)
            })
            mlflow.sklearn.log_model(self.model, "model")

        return self

    def predict(self, df: pd.DataFrame) -> pd.DataFrame:
        """Predict anomalies"""
        X = df[self.feature_columns].values
        X_scaled = self.scaler.transform(X)

        # Predict (-1 = anomaly, 1 = normal)
        predictions = self.model.predict(X_scaled)

        # Get anomaly scores (lower = more anomalous)
        scores = self.model.decision_function(X_scaled)

        df['is_anomaly'] = predictions == -1
        df['anomaly_score'] = -scores  # Invert so higher = more anomalous

        return df

    def save(self, path: str):
        """Save model to disk"""
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'feature_columns': self.feature_columns
        }, path)

    @classmethod
    def load(cls, path: str) -> 'IsolationForestAnomalyDetector':
        """Load model from disk"""
        data = joblib.load(path)
        detector = cls()
        detector.model = data['model']
        detector.scaler = data['scaler']
        detector.feature_columns = data['feature_columns']
        return detector
```

#### Day 2 (Tuesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design LSTM architecture for sequences | Critical | 2h | Architecture design |
| Implement LSTM autoencoder | Critical | 4h | LSTM model |
| Create sequence data preparation | High | 2h | Sequence prep |

**LSTM Autoencoder:**
```python
# src/models/anomaly/lstm.py
import torch
import torch.nn as nn

class LSTMAutoencoder(nn.Module):
    """
    LSTM Autoencoder for sequence anomaly detection.
    High reconstruction error indicates anomaly.
    """

    def __init__(
        self,
        input_dim: int,
        hidden_dim: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2
    ):
        super().__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim

        # Encoder
        self.encoder = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )

        # Decoder
        self.decoder = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout
        )

        # Output projection
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        # Encode
        _, (hidden, cell) = self.encoder(x)

        # Repeat hidden state for decoder input
        decoder_input = hidden[-1].unsqueeze(1).repeat(1, x.size(1), 1)

        # Decode
        decoder_output, _ = self.decoder(decoder_input, (hidden, cell))

        # Project to original dimension
        output = self.output_layer(decoder_output)

        return output


class LSTMSequenceAnomalyDetector:
    """
    Detect anomalies in time sequences using LSTM autoencoder.
    """

    def __init__(
        self,
        sequence_length: int = 24,
        hidden_dim: int = 64,
        threshold_percentile: float = 95
    ):
        self.sequence_length = sequence_length
        self.hidden_dim = hidden_dim
        self.threshold_percentile = threshold_percentile
        self.model = None
        self.threshold = None
        self.scaler = StandardScaler()

    def prepare_sequences(self, df: pd.DataFrame, feature_columns: List[str]) -> np.ndarray:
        """Convert dataframe to sequences"""
        data = df[feature_columns].values
        data_scaled = self.scaler.fit_transform(data)

        sequences = []
        for i in range(len(data_scaled) - self.sequence_length + 1):
            sequences.append(data_scaled[i:i + self.sequence_length])

        return np.array(sequences)

    def fit(self, df: pd.DataFrame, feature_columns: List[str], epochs: int = 50):
        """Train the LSTM autoencoder"""
        sequences = self.prepare_sequences(df, feature_columns)

        self.model = LSTMAutoencoder(
            input_dim=len(feature_columns),
            hidden_dim=self.hidden_dim
        )

        # Training loop
        optimizer = torch.optim.Adam(self.model.parameters())
        criterion = nn.MSELoss()

        for epoch in range(epochs):
            self.model.train()
            X = torch.FloatTensor(sequences)
            reconstructed = self.model(X)
            loss = criterion(reconstructed, X)

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        # Calculate threshold
        self.model.eval()
        with torch.no_grad():
            X = torch.FloatTensor(sequences)
            reconstructed = self.model(X)
            errors = torch.mean((X - reconstructed) ** 2, dim=(1, 2)).numpy()
            self.threshold = np.percentile(errors, self.threshold_percentile)

        return self

    def predict(self, df: pd.DataFrame, feature_columns: List[str]) -> List[dict]:
        """Detect anomalies in new data"""
        sequences = self.prepare_sequences(df, feature_columns)

        self.model.eval()
        with torch.no_grad():
            X = torch.FloatTensor(sequences)
            reconstructed = self.model(X)
            errors = torch.mean((X - reconstructed) ** 2, dim=(1, 2)).numpy()

        anomalies = []
        for i, error in enumerate(errors):
            if error > self.threshold:
                anomalies.append({
                    'sequence_index': i,
                    'reconstruction_error': float(error),
                    'threshold': float(self.threshold),
                    'severity': 'high' if error > self.threshold * 1.5 else 'medium'
                })

        return anomalies
```

#### Day 3 (Wednesday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Create model training pipeline | Critical | 3h | Training pipeline |
| Implement cross-validation | High | 2h | CV implementation |
| Add hyperparameter optimization | High | 2h | Hyperparameter search |
| Create training scheduling | Medium | 1h | Scheduling |

#### Day 4 (Thursday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement model evaluation metrics | Critical | 3h | Evaluation metrics |
| Create confusion matrix analysis | High | 2h | Confusion matrix |
| Add precision/recall/F1 tracking | High | 2h | Metrics tracking |
| Build evaluation dashboard | Medium | 1h | Dashboard |

**Model Evaluation:**
```python
# src/training/evaluator.py
class AnomalyModelEvaluator:
    """Evaluate anomaly detection models"""

    def __init__(self, model):
        self.model = model

    def evaluate(self, X_test: np.ndarray, y_true: np.ndarray) -> dict:
        """Comprehensive model evaluation"""
        y_pred = self.model.predict(X_test)

        # Basic metrics
        precision = precision_score(y_true, y_pred)
        recall = recall_score(y_true, y_pred)
        f1 = f1_score(y_true, y_pred)

        # ROC AUC if model provides scores
        if hasattr(self.model, 'decision_function'):
            scores = self.model.decision_function(X_test)
            roc_auc = roc_auc_score(y_true, -scores)
        else:
            roc_auc = None

        metrics = {
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'roc_auc': roc_auc,
            'true_positives': int(np.sum((y_true == 1) & (y_pred == 1))),
            'false_positives': int(np.sum((y_true == 0) & (y_pred == 1))),
            'true_negatives': int(np.sum((y_true == 0) & (y_pred == 0))),
            'false_negatives': int(np.sum((y_true == 1) & (y_pred == 0)))
        }

        # Log to MLflow
        with mlflow.start_run(run_name="model_evaluation"):
            mlflow.log_metrics(metrics)

        return metrics
```

#### Day 5 (Friday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Integration with backend API | Critical | 2h | API integration |
| Phase 1 demo preparation | High | 2h | Demo prep |
| Phase 1 demo participation | Critical | 2h | Demo delivered |
| Phase 1 retrospective | High | 1h | Retrospective |
| PR and documentation | High | 1h | PR submitted |

---

# Phase 2: Integration & Features (Weeks 5-8)

## Week 5: Feature Store Implementation

### Weekly Milestone
- [ ] Feature store architecture
- [ ] Feature computation pipeline
- [ ] Feature serving API
- [ ] Feature versioning

### Daily Breakdown

#### Day 1 (Monday)
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Design feature store architecture | Critical | 3h | Architecture doc |
| Create feature registry | Critical | 2h | Registry |
| Implement feature definitions | High | 2h | Definitions |
| Set up feature database schema | High | 1h | Schema |

**Feature Store:**
```python
# src/features/store.py
class FeatureStore:
    """
    Centralized feature management and serving.
    """

    def __init__(self, db_connector: DatabaseConnector):
        self.db = db_connector
        self.feature_registry = {}

    def register_feature(
        self,
        name: str,
        description: str,
        computation_fn: Callable,
        dependencies: List[str] = None
    ):
        """Register a feature definition"""
        self.feature_registry[name] = {
            'name': name,
            'description': description,
            'computation_fn': computation_fn,
            'dependencies': dependencies or [],
            'version': 1
        }

    def compute_features(
        self,
        entity_id: str,
        feature_names: List[str],
        timestamp: datetime
    ) -> dict:
        """Compute features for an entity at a point in time"""
        results = {}

        for name in feature_names:
            if name not in self.feature_registry:
                raise ValueError(f"Unknown feature: {name}")

            feature_def = self.feature_registry[name]

            # Check dependencies
            for dep in feature_def['dependencies']:
                if dep not in results:
                    results[dep] = self.compute_features(entity_id, [dep], timestamp)[dep]

            # Compute feature
            results[name] = feature_def['computation_fn'](entity_id, timestamp, results)

        return results

    def get_training_features(
        self,
        entity_ids: List[str],
        feature_names: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """Get historical features for training"""
        # Implementation for batch feature retrieval
        pass
```

#### Day 2-5
- Continue feature store implementation
- Real-time feature computation
- Feature caching layer
- Integration with training pipeline

---

## Week 6: Predictive Analytics

### Weekly Milestone
- [ ] GGR forecasting model
- [ ] Tax revenue prediction
- [ ] Trend analysis
- [ ] Confidence intervals

### Daily Breakdown

#### Day 1-2
| Task | Priority | Duration | Deliverable |
|------|----------|----------|-------------|
| Implement Prophet for GGR forecasting | Critical | 6h | Prophet model |
| Create seasonality handling | High | 4h | Seasonality |
| Add holiday effects | Medium | 2h | Holiday adjustment |

**GGR Forecasting:**
```python
# src/models/forecasting/prophet.py
from prophet import Prophet

class GGRForecaster:
    """Forecast GGR using Facebook Prophet"""

    def __init__(self, seasonality_mode: str = 'multiplicative'):
        self.model = Prophet(
            seasonality_mode=seasonality_mode,
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True
        )

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for Prophet"""
        return df.rename(columns={
            'date': 'ds',
            'ggr': 'y'
        })[['ds', 'y']]

    def fit(self, df: pd.DataFrame):
        """Train the forecasting model"""
        prophet_df = self.prepare_data(df)
        self.model.fit(prophet_df)
        return self

    def predict(self, periods: int = 30) -> pd.DataFrame:
        """Generate forecasts"""
        future = self.model.make_future_dataframe(periods=periods)
        forecast = self.model.predict(future)
        return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
```

#### Day 3-5
- Tax revenue prediction model
- Operator growth prediction
- Market trend analysis
- Forecast API endpoints

---

## Week 7: Model Serving Infrastructure

### Weekly Milestone
- [ ] FastAPI inference service
- [ ] Model loading and caching
- [ ] Batch and real-time inference
- [ ] API documentation

### Daily Breakdown

**Model Serving API:**
```python
# src/serving/api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

app = FastAPI(title="GGRAS ML API")

class AnomalyRequest(BaseModel):
    operator_id: str
    metrics: dict
    timestamp: str

class AnomalyResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    anomaly_types: List[str]
    severity: str
    explanations: List[str]

@app.post("/api/v1/anomaly/detect", response_model=AnomalyResponse)
async def detect_anomaly(request: AnomalyRequest):
    """Detect anomalies in operator metrics"""
    try:
        result = anomaly_service.detect(
            operator_id=request.operator_id,
            metrics=request.metrics,
            timestamp=request.timestamp
        )
        return AnomalyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/forecast/ggr")
async def forecast_ggr(operator_id: str, periods: int = 30):
    """Forecast GGR for an operator"""
    return forecasting_service.predict(operator_id, periods)
```

---

## Week 8: Integration & Phase 2 Completion

### Weekly Milestone
- [ ] Full integration with backend
- [ ] Alert generation pipeline
- [ ] Model performance monitoring
- [ ] Phase 2 demo ready

---

# Phase 3: Production Readiness (Weeks 9-12)

## Week 9-10: Production Hardening

### Focus Areas
- Model performance optimization
- Batch inference optimization
- Memory usage optimization
- Error handling and resilience
- Model monitoring setup

## Week 11: Pilot Support

### Focus Areas
- Production deployment support
- Model accuracy monitoring
- False positive analysis
- Model retraining based on feedback

## Week 12: Final Release & Handover

### Focus Areas
- Final model versioning
- Documentation completion
- Knowledge transfer
- Model maintenance handover

---

## Model Performance Targets

| Model | Metric | Target |
|-------|--------|--------|
| Under-reporting Detection | Precision | > 85% |
| Under-reporting Detection | Recall | > 90% |
| Payout Spike Detection | Precision | > 90% |
| Feed Drop Detection | Recall | > 95% |
| GGR Forecasting | MAPE | < 10% |
| LSTM Anomaly | F1 Score | > 80% |

---

## Definition of Done

### For Each Model:
- [ ] Model achieves target metrics
- [ ] Training pipeline documented
- [ ] Model versioned in MLflow
- [ ] Inference API tested
- [ ] Unit tests written
- [ ] Integration tests pass
- [ ] Code reviewed and approved
- [ ] Documentation complete

---

## Notes

- Coordinate with AI-2 on risk scoring integration
- Coordinate with BE-1 on data pipeline
- Use MLflow for all experiment tracking
- Implement proper model versioning
- Monitor model drift in production
- Set up alerting for model degradation

## Service Catalog Appendix (AI-1)

| Service | Purpose | Interfaces |
|---------|---------|------------|
| ml-anomaly-service | Anomaly detection scores | OpenAPI + events |
| feature-store-service | Feature compute/serve | OpenAPI |
| model-training-service | Training pipelines | OpenAPI |
| model-serving-service | Inference APIs | OpenAPI |

