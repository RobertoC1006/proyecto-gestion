"""Forecast/evaluation without future leakage, compared against weekly naive."""
import calendar
import csv
import hashlib
import json
import warnings
from datetime import date, timedelta
from pathlib import Path
import numpy as np
import pandas as pd
import statsmodels
from statsmodels.tsa.statespace.sarimax import SARIMAX

VERSION = 'demand-v1'
PARAMETERS = {'order': [1, 0, 1], 'seasonal_order': [1, 0, 0, 7], 'trend': 'c', 'maxiter': 200, 'trainingDays': 365}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


def event_kind(d):
    return 'matricula' if d.month in (3, 8) and d.day < 15 else 'examen' if d.month in (5, 7, 10, 12) and 8 <= d.day <= 19 else None


def synthetic(origin, seed=20261125):
    """Exactly 43,000 fictitious arrivals over 24 calendar months, no business rows."""
    start = date(origin.year - 2, origin.month, min(origin.day, calendar.monthrange(origin.year - 2, origin.month)[1]))
    days = pd.date_range(start, origin - timedelta(days=1), freq='D')
    events = [{'date': d.strftime('%Y-%m-%d'), 'type': event_kind(d), 'availableAt': (d.date() - timedelta(days=30)).isoformat()}
              for d in pd.date_range(start, origin + timedelta(days=13), freq='D') if event_kind(d)]
    weights = np.array([(0.45 if d.weekday() >= 5 else 1.0) * (1.65 if event_kind(d) else 1.0) for d in days]) * np.linspace(0.8, 1.2, len(days))
    counts = np.random.default_rng(seed).multinomial(43000, weights / weights.sum())
    return [{'date': d.strftime('%Y-%m-%d'), 'count': int(n)} for d, n in zip(days, counts)], events


def features(days, events, cutoff):
    result = np.zeros((len(days), 3)); positions = {pd.Timestamp(d).strftime('%Y-%m-%d'): i for i, d in enumerate(days)}
    for e in events:
        if e['availableAt'][:10] <= cutoff and e['type'] in ('examen', 'entrega', 'matricula') and e['date'] in positions:
            result[positions[e['date']], ('examen', 'entrega', 'matricula').index(e['type'])] += 1
    return np.minimum(result, 20)


def baseline(values, steps=14):
    return np.array([values[len(values) - 7 + i % 7] for i in range(steps)], dtype=float)


def candidate(values, days, events, cutoff):
    train_days = days[-365:]; y = np.asarray(values[-365:], dtype=float)
    future = pd.date_range(pd.Timestamp(days[-1]) + pd.Timedelta(days=1), periods=14, freq='D')
    x = features(train_days, events, cutoff); mask = np.std(x, axis=0) > 0
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        fitted = SARIMAX(y, exog=x[:, mask] if mask.any() else None, order=(1, 0, 1), seasonal_order=(1, 0, 0, 7), trend='c', enforce_stationarity=False, enforce_invertibility=False).fit(disp=False, maxiter=200)
    if not fitted.mle_retvals.get('converged', False): raise ValueError('Model did not converge')
    prediction = fitted.get_forecast(14, exog=features(future, events, cutoff)[:, mask] if mask.any() else None)
    mean = np.maximum(0, np.asarray(prediction.predicted_mean)); bounds = np.maximum(0, np.asarray(prediction.conf_int(alpha=0.05)))
    if not np.isfinite(mean).all() or not np.isfinite(bounds).all(): raise ValueError('Non-finite model')
    return mean, bounds, fitted


def metrics(actual, predicted):
    a, p = np.asarray(actual), np.asarray(predicted); nonzero = a != 0
    return {'mae': float(np.abs(a - p).mean()), 'mape': float(np.abs((a[nonzero] - p[nonzero]) / a[nonzero]).mean() * 100) if nonzero.any() else None,
            'zeroExcluded': int((~nonzero).sum()), 'samples': len(a)}


def evaluate(values, days, events):
    actual, naive, sarimax, folds, points = [], [], [], [], []; candidate_ok = True
    for end in (len(values) - 28, len(values) - 14, len(values)):
        cut = end - 14; cutoff = days[cut - 1].strftime('%Y-%m-%d')
        observed = values[cut:end]; reference = baseline(values[:cut])
        try: estimate, _, _ = candidate(values[:cut], days[:cut], events, cutoff)
        except (ValueError, np.linalg.LinAlgError): candidate_ok = False; estimate = None
        actual.extend(observed); naive.extend(reference)
        if estimate is not None: sarimax.extend(estimate)
        folds.append({'trainThrough': cutoff, 'testFrom': days[cut].strftime('%Y-%m-%d'), 'testThrough': days[end - 1].strftime('%Y-%m-%d')})
        points.extend({'date': days[cut+i].strftime('%Y-%m-%d'), 'observed': float(n), 'weekly_naive': float(reference[i]), 'sarimax': float(estimate[i]) if estimate is not None else None} for i, n in enumerate(observed))
    results = {'weekly_naive': metrics(actual, naive), 'sarimax': metrics(actual, sarimax) if candidate_ok else None}
    selected = 'sarimax' if candidate_ok and results['sarimax']['mae'] < results['weekly_naive']['mae'] else 'weekly_naive'
    return {'metrics': results, 'selectedModel': selected, 'folds': folds, 'points': points, 'candidateStatus': 'available' if candidate_ok else 'fit_failed'}


def run(data, root: Path):
    origin = date.fromisoformat(data['origin']); source = data['source']; seed = 20261125
    if source not in ('synthetic', 'operational') or data.get('kind') not in ('forecast', 'evaluate'): raise ValueError('source/kind')
    rows, events = synthetic(origin, seed) if source == 'synthetic' else (data['observed'], data.get('events', []))
    if len(rows) > 1100 or len(events) > 15000: raise ValueError('dataset too large')
    dates = [date.fromisoformat(r['date']) for r in rows]; values = [r['count'] for r in rows]
    if dates and (dates[-1] != origin - timedelta(days=1) or any(b - a != timedelta(days=1) for a, b in zip(dates, dates[1:]))): raise ValueError('Incomplete observation window')
    if any(type(v) is not int or v < 0 for v in values): raise ValueError('Counts must be nonnegative integers')
    fingerprint = digest({'observed': rows, 'events': events, 'source': source})
    provenance = {'source': source, 'unit': 'tickets/day', 'timezone': 'America/Lima', 'horizonDays': 14, 'datasetHash': fingerprint,
                  'engineVersion': VERSION, 'libraries': {'pandas': pd.__version__, 'statsmodels': statsmodels.__version__, 'numpy': np.__version__},
                  'parameters': PARAMETERS, 'seed': seed if source == 'synthetic' else None, 'observationDays': len(rows), 'totalTickets': sum(values),
                  'from': rows[0]['date'] if rows else None, 'through': rows[-1]['date'] if rows else None, 'origin': data['origin']}
    if len(rows) < 126: return {**provenance, 'status': 'unavailable', 'reason': 'Se necesitan al menos 126 días completos y consecutivos observados.', 'observed': rows, 'forecast': [], 'evaluation': None}
    days = pd.to_datetime(dates); previous = data.get('evaluation')
    evaluation = evaluate(values, days, events) if data['kind'] == 'evaluate' or not previous else previous
    selected = evaluation['selectedModel']; fitted = None; bounds = None
    if selected == 'sarimax': estimate, bounds, fitted = candidate(values, days, events, (origin - timedelta(days=1)).isoformat())
    else: estimate = baseline(values)
    forecast = [{'date': (origin + timedelta(days=i)).isoformat(), 'value': round(float(n), 4), 'lower': round(float(bounds[i, 0]), 4) if bounds is not None else None, 'upper': round(float(bounds[i, 1]), 4) if bounds is not None else None} for i, n in enumerate(estimate)]
    result = {**provenance, 'status': 'available', 'model': selected, 'intervalLevel': 0.95 if bounds is not None else None,
              'observed': rows, 'forecast': forecast, 'evaluation': evaluation, 'featurePolicy': 'Published academic features at or before each cutoff; no future actual counts.'}
    folder = root / data['runId']; folder.mkdir(parents=True, exist_ok=True)
    if source == 'synthetic':
        with (folder / 'synthetic-tickets.csv').open('w', newline='', encoding='utf-8') as stream:
            writer = csv.writer(stream); writer.writerow(['synthetic_id', 'registered_local_date', 'source']); number = 0
            for r in rows:
                for _ in range(r['count']): number += 1; writer.writerow([f'SYN-{number:05}', r['date'], 'synthetic'])
    if fitted is not None: fitted.save(folder / 'sarimax.pickle')
    payload = json.dumps(result, sort_keys=True, allow_nan=False).encode(); temporary = folder / 'result.tmp'
    temporary.write_bytes(payload); temporary.replace(folder / 'result.json')
    result['artifact'] = {'key': f"{data['runId']}/result.json", 'sha256': hashlib.sha256(payload).hexdigest()}
    return result
