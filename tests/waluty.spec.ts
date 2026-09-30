import { test, expect } from '@playwright/test';
import { BigQuery } from '@google-cloud/bigquery';
import 'dotenv/config';

const bq = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
const tabela = (nazwa: string) =>
  `\`${process.env.GCP_PROJECT_ID}.${process.env.BQ_DATASET}.${nazwa}\``;

test('transakcje: waluta zgodna z walutą konta', async ({}, testInfo) => {
  const sql = `
    SELECT tr.trans_id, tr.nr_konta, tr.waluta AS waluta_transakcji, k.waluta AS waluta_konta
    FROM ${tabela('transakcje')} tr
    JOIN ${tabela('konta')} k USING (nr_konta)
    WHERE tr.waluta != k.waluta`;

  const [niezgodne] = await bq.query({ query: sql, location: process.env.BQ_LOCATION });

  if (niezgodne.length > 0) {
    await testInfo.attach('niezgodne-waluty.json', {
      body: JSON.stringify(niezgodne.slice(0, 20), null, 2),
      contentType: 'application/json',
    });
  }

  expect(niezgodne, `Transakcji w innej walucie niż konto: ${niezgodne.length}`).toHaveLength(0);
});
