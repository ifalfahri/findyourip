import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.resolve('.', 'visitorCount.json');
  const jsonData = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(jsonData);

  data.count += 1;

  fs.writeFileSync(filePath, JSON.stringify(data));

  res.status(200).json(data);
}