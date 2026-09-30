import { test, expect } from '@playwright/test';
import { BigQuery } from '@google-cloud/bigquery';
import 'dotenv/config';

const bq = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
const tabela = (nazwa: string) =>
  `\`${process.env.GCP_PROJECT_ID}.${process.env.BQ_DATASET}.${nazwa}\``;

test('transakcje: trans_id jest unikalny', async ({}, testInfo) => {
  const sql = `
    SELECT trans_id, COUNT(*) AS ile
    FROM ${tabela('transakcje')}
    GROUP BY trans_id
    HAVING COUNT(*) > 1
    ORDER BY trans_id`;

  const [duplikaty] = await bq.query({ query: sql, location: process.env.BQ_LOCATION });

  if (duplikaty.length > 0) {
    await testInfo.attach('duplikaty.json', {
      body: JSON.stringify(duplikaty.slice(0, 20), null, 2),
      contentType: 'application/json',
    });
  }

  expect(duplikaty, `Zdublowanych trans_id: ${duplikaty.length}`).toHaveLength(0);
});