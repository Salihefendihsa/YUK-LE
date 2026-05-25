/**
 * Generates src/data/tr-location-districts.ts from turkiye-api districts.json
 * Kaynak mobil ile ayni: scripts/data/districts.json
 * Run: node scripts/generate-tr-districts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const districtsPath = path.join(__dirname, 'data', 'districts.json')
const citiesPath = path.join(root, 'src', 'data', 'tr-location.ts')

const districts = JSON.parse(fs.readFileSync(districtsPath, 'utf8'))
const citiesSrc = fs.readFileSync(citiesPath, 'utf8')
const citiesMatch = citiesSrc.match(/export const TR_CITIES = \[([\s\S]*?)\]/)
if (!citiesMatch) throw new Error('TR_CITIES not found')
const TR_CITIES = [...citiesMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1])

function fold(s) {
  return s
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
}

const cityByFold = new Map(TR_CITIES.map((c) => [fold(c), c]))
const map = {}

for (const row of districts) {
  const key = cityByFold.get(fold(row.province)) ?? row.province
  if (!TR_CITIES.includes(key)) {
    console.warn('Unknown province:', row.province, '->', key)
    continue
  }
  if (!map[key]) map[key] = []
  if (!map[key].includes(row.name)) map[key].push(row.name)
}

for (const city of TR_CITIES) {
  if (!map[city]) {
    console.warn('No districts for', city)
    map[city] = ['Merkez']
  }
  map[city].sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

const totalDistricts = Object.values(map).reduce((n, arr) => n + arr.length, 0)
console.log('Provinces:', TR_CITIES.length, 'Districts:', totalDistricts)

const lines = Object.entries(map)
  .map(([city, list]) => {
    const items = list.map((d) => `'${d.replace(/'/g, "\\'")}'`).join(', ')
    return `  ${JSON.stringify(city)}: [${items}],`
  })
  .join('\n')

const out = `/**
 * AUTO-GENERATED — scripts/generate-tr-districts.mjs
 * Kaynak: turkiye-api districts.json (${totalDistricts} ilce, ${TR_CITIES.length} il)
 * Elle duzenlemeyin; yenilemek icin: node scripts/generate-tr-districts.mjs
 */
export const DISTRICT_MAP: Record<string, string[]> = {
${lines}
};
`

const outPath = path.join(root, 'src', 'data', 'tr-location-districts.ts')
fs.writeFileSync(outPath, out, 'utf8')
console.log('Wrote', outPath)
