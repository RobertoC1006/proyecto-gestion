import json
import tempfile
import unittest
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import patch
import numpy as np
from engine import synthetic, features, baseline, metrics, run, digest

class DemandTests(unittest.TestCase):
    def test_reproducible_separate_24_months(self):
        a, events = synthetic(date(2026,11,25)); b, _ = synthetic(date(2026,11,25))
        self.assertEqual(a,b); self.assertEqual(sum(r['count'] for r in a),43000)
        self.assertEqual(a[0]['date'],'2024-11-25'); self.assertEqual(a[-1]['date'],'2026-11-24')
    def test_weekly_naive_and_zero_mape(self):
        np.testing.assert_equal(baseline(list(range(14))),[7,8,9,10,11,12,13]*2)
        m=metrics([0,10],[5,12]); self.assertEqual(m['mae'],3.5); self.assertEqual(m['zeroExcluded'],1); self.assertAlmostEqual(m['mape'],20)
        self.assertIsNone(metrics([0],[1])['mape'])
    def test_no_future_calendar_leakage(self):
        x=features(['2026-11-25'],[{'date':'2026-11-25','type':'examen','availableAt':'2026-11-26'}],'2026-11-24')
        self.assertEqual(x.sum(),0)
    def test_insufficient_and_missing_are_honest(self):
        data={'runId':'11111111-1111-1111-1111-111111111111','source':'operational','kind':'evaluate','origin':'2026-11-25','observed':[]}
        with tempfile.TemporaryDirectory() as folder:
            self.assertEqual(run(data,Path(folder))['status'],'unavailable')
            data['observed']=[{'date':'2026-11-23','count':0}]
            with self.assertRaises(ValueError):run(data,Path(folder))
    def test_actual_evaluation_and_artifacts(self):
        with tempfile.TemporaryDirectory() as folder:
            data={'runId':'11111111-1111-1111-1111-111111111111','source':'synthetic','kind':'evaluate','origin':'2026-11-25'}
            r=run(data,Path(folder)); self.assertEqual(len(r['forecast']),14); self.assertEqual(len(r['evaluation']['folds']),3)
            for f in r['evaluation']['folds']:self.assertLess(f['trainThrough'],f['testFrom'])
            self.assertEqual(r['evaluation']['metrics']['weekly_naive']['samples'],42)
            if r['model']=='weekly_naive':self.assertTrue(all(p['lower'] is None for p in r['forecast']))
            path=Path(folder)/r['artifact']['key'];self.assertTrue(path.is_file())
            import hashlib
            self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),r['artifact']['sha256'])
            self.assertEqual(len((path.parent/'synthetic-tickets.csv').read_text().splitlines()),43001)
            print(json.dumps({'model':r['model'],'metrics':r['evaluation']['metrics'],'hash':r['datasetHash']}))

if __name__=='__main__':unittest.main()
