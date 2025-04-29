const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bodyParser = require('body-parser');
const cors = require('cors');
const SerpApi = require('google-search-results-nodejs');
require('dotenv').config();

const app = express();
const PORT = 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(bodyParser.json());

const search = new SerpApi.GoogleSearch(process.env.SERP_API_KEY);

async function serpSearch(query) {
    return new Promise((resolve, reject) => {
      search.json(
        {
          q: query,
          hl: 'en',
          num: 5,
        },
        (data) => {
          const results = data.organic_results?.map((r) => ({
            link: r.link,
            snippet: r.snippet,
          })) || [];
          resolve(results);
        },
        (err) => {
          console.error('SerpAPI error:', err);
          reject(err);
        }
      );
    });
  }
  


async function extractTextFromPage(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  return $('body').text().replace(/\s+/g, ' ').slice(0, 3000); // Shorten to avoid long prompts
}

async function getCompetitorsFromGemini(text, brand) {
  const prompt = `Given the following information about ${brand}, extract a list of competitor company names:\n\n${text}\n\nList only the company names:`;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  const content = response.text();
  return content.trim().split(/\n|,|\*/).map(x => x.trim()).filter(Boolean);
}

app.post('/api/competitors', async (req, res) => {
    const { brand } = req.body;
    try {
      const results = await serpSearch(`${brand} competitors`);
      if (!results.length) return res.status(404).json({ error: 'No search results found' });
  
      const topResult = results[0];
      const text = topResult.snippet || '';
      
      const competitors = await getCompetitorsFromGemini(text, brand);
  
      res.json({ competitors, source: topResult.link });
    } catch (err) {
      console.error('Error in /api/competitors:', err);
      res.status(500).json({ error: 'Failed to retrieve competitors' });
    }
  });
  

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
