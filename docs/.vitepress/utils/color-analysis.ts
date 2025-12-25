
// Color space conversion and distance utilities

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Lab {
  l: number;
  a: number;
  b: number;
}

export interface ColorResult {
  hex: string;
  rgb: RGB;
  percentage: number;
  role: string; // 'Primary', 'Secondary', 'Accent', 'Neutral'
  lab: Lab;
}

// Convert RGB to Lab
export function rgbToLab(rgb: RGB): Lab {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) * 100;
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) * 100;
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) * 100;

  x = x / 95.047;
  y = y / 100.000;
  z = z / 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return {
    l: (116 * y) - 16,
    a: 500 * (x - y),
    b: 200 * (y - z)
  };
}

// CIE76 Delta E
export function deltaE(lab1: Lab, lab2: Lab): number {
  return Math.sqrt(
    Math.pow(lab1.l - lab2.l, 2) +
    Math.pow(lab1.a - lab2.a, 2) +
    Math.pow(lab1.b - lab2.b, 2)
  );
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return "#" + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

// K-Means++ implementation
interface Point {
  lab: Lab;
  rgb: RGB;
  count: number; // weight of this unique color from sampling
}

function getRandomCentroids(points: Point[], k: number): Point[] {
  const centroids: Point[] = [];
  
  // Smart Initialization:
  // 1. Always include the most frequent color (Background)
  // 2. Always include the most saturated color (Accent)
  // 3. Always include the lightest and darkest colors (Contrast)
  
  // Sort by count for first pick
  const sortedByCount = [...points].sort((a, b) => b.count - a.count);
  if (sortedByCount.length > 0) centroids.push(sortedByCount[0]);

  // Sort by chroma for second pick
  const getChroma = (p: Point) => Math.sqrt(p.lab.a * p.lab.a + p.lab.b * p.lab.b);
  const sortedByChroma = [...points].sort((a, b) => getChroma(b) - getChroma(a));
  
  // Add highest chroma point if distinct
  if (sortedByChroma.length > 0) {
     const p = sortedByChroma[0];
     // Simple distinct check against first centroid
     if (centroids.length === 0 || deltaE(p.lab, centroids[0].lab) > 10) {
        centroids.push(p);
     }
  }

  // Add random if we still need more
  if (centroids.length === 0) {
     centroids.push(points[Math.floor(Math.random() * points.length)]);
  }

  while (centroids.length < k) {
    // 2. For each data point x, compute D(x)
    const distances = points.map(p => {
      let minDesc = Infinity;
      for (const c of centroids) {
        const d = Math.pow(deltaE(p.lab, c.lab), 2); // Squared distance
        if (d < minDesc) minDesc = d;
      }
      return minDesc;
    });

    // 3. Choose one new data point at random with weighted probability
    const sum = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    
    for (let i = 0; i < distances.length; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push(points[i]);
        break;
      }
    }
    // Fallback
    if (centroids.length < centroids.length + 1 && r > 0) {
       centroids.push(points[points.length - 1]);
    }
  }
  return centroids;
}

export function kMeans(points: Point[], k: number, maxIterations = 20): { centroids: Point[], clusters: Point[][] } {
  // ... existing implementation ...
  let centroids = getRandomCentroids(points, k);
  let clusters: Point[][] = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < maxIterations; iter++) {
    clusters = Array.from({ length: k }, () => []);
    let changed = false;

    // Assignment step
    for (const p of points) {
      let minDist = Infinity;
      let clusterIndex = 0;
      for (let i = 0; i < k; i++) {
        const d = deltaE(p.lab, centroids[i].lab);
        if (d < minDist) {
          minDist = d;
          clusterIndex = i;
        }
      }
      clusters[clusterIndex].push(p);
    }

    // Update step
    const newCentroids: Point[] = [];
    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) {
        // Handle empty cluster by picking a random point (simplified re-init)
        newCentroids.push(points[Math.floor(Math.random() * points.length)]);
        continue;
      }

      let sumL = 0, sumA = 0, sumB = 0, sumR = 0, sumG = 0, sumB_rgb = 0, totalWeight = 0;
      for (const p of cluster) {
        const w = p.count; // Use pixel count as weight
        sumL += p.lab.l * w;
        sumA += p.lab.a * w;
        sumB += p.lab.b * w;
        sumR += p.rgb.r * w;
        sumG += p.rgb.g * w;
        sumB_rgb += p.rgb.b * w;
        totalWeight += w;
      }
      
      const newLab = { l: sumL / totalWeight, a: sumA / totalWeight, b: sumB / totalWeight };
      // Also average RGB to keep it in sync (approximate)
      const newRgb = { r: sumR / totalWeight, g: sumG / totalWeight, b: sumB_rgb / totalWeight };
      
      newCentroids.push({ lab: newLab, rgb: newRgb, count: totalWeight });
    }

    // Check convergence (simplified: check if centroids moved significantly)
    let moveDist = 0;
    for (let i = 0; i < k; i++) {
      moveDist += deltaE(centroids[i].lab, newCentroids[i].lab);
    }
    centroids = newCentroids;
    if (moveDist < 1.0) break;
  }

  return { centroids, clusters };
}

// Filter and scoring logic
function scoreColor(lab: Lab): number {
  // 1. Penalize low saturation
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let score = chroma;

  // 2. Penalize extreme lightness
  if (lab.l < 10 || lab.l > 90) {
    score *= 0.5;
  }
  
  // 3. Penalize very dark colors specifically if we want "design tool" vibes
  // Deeply penalize anything < 15 to respond to "eyes are not sensitive to dark color differences"
  if (lab.l < 15) score *= 0.1;
  if (lab.l < 5) score = 0;

  return score;
}

export function processImage(
  img: HTMLImageElement, 
  canvas: HTMLCanvasElement, 
  targetCount: number
): ColorResult[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("No context");

  // Resize for sampling - increased size for better detail
  const MAX_SIZE = 150;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > h) {
    if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
  } else {
    if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
  }
  
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  
  // Collect points
  const pointMap = new Map<string, Point>();
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    const a = data[i+3];
    
    if (a < 128) continue; // Skip transparent

    // Quantize slightly to reduce initial set size
    const key = `${Math.round(r/5)*5},${Math.round(g/5)*5},${Math.round(b/5)*5}`;
    
    if (pointMap.has(key)) {
      pointMap.get(key)!.count++;
    } else {
      const rgb = { r, g, b };
      pointMap.set(key, {
        rgb,
        lab: rgbToLab(rgb),
        count: 1
      });
    }
  }

  let points = Array.from(pointMap.values());
  
  // If too few colors, return what we have
  if (points.length <= targetCount) {
    return points.map(p => ({
      hex: rgbToHex(p.rgb),
      rgb: p.rgb,
      lab: p.lab,
      percentage: 100 / points.length, // Rough
      role: 'Neutral'
    })).sort((a, b) => b.percentage - a.percentage);
  }

  // K-Means
  // Increase cluster count significantly to capture accents
  const k = Math.min(points.length, Math.max(targetCount * 5, 32)); 
  const { centroids, clusters } = kMeans(points, k);

  // Process results
  let results = centroids.map((c, i) => {
    const clusterPoints = clusters[i];
    const totalCount = clusterPoints.reduce((sum, p) => sum + p.count, 0);
    // If a cluster is empty or super small, ignore it
    if (totalCount === 0) return null;
    
    return {
      hex: rgbToHex(c.rgb),
      rgb: c.rgb,
      lab: c.lab,
      count: totalCount,
      chroma: Math.sqrt(c.lab.a * c.lab.a + c.lab.b * c.lab.b)
    };
  }).filter((r): r is NonNullable<typeof r> => r !== null);
  
  // --- OUTLIER RECALL: Check for high-chroma points that got lost ---
  // Iterate all points, check distance to nearest centroid. 
  // If far and high chroma, add as candidate.
  const highChromaThreshold = 30; // "Colorful" threshold
  const outlierDistThreshold = 15; // Distance to be considered "lost"
  
  const outliers: Point[] = [];
  
  // To avoid iterating all points again (expensive), let's just sample or check cluster errors.
  // Actually, we can check the clusters returned by kMeans. 
  // But kMeans returns assigned points. We want to find if a small group of high chroma points 
  // got averaged into a dull cluster.
  
  // Let's iterate the clusters. If a cluster has high variance or contains high chroma points
  // but the centroid is low chroma, we might want to split it or extract the high chroma part.
  
  const recallCandidates: typeof results = [];
  
  clusters.forEach((cluster, i) => {
     if (cluster.length === 0) return;
     
     // Find max chroma point in this cluster
     let maxChroma = -1;
     let maxChromaPoint: Point | null = null;
     
     for (const p of cluster) {
         const c = Math.sqrt(p.lab.a * p.lab.a + p.lab.b * p.lab.b);
         if (c > maxChroma) {
             maxChroma = c;
             maxChromaPoint = p;
         }
     }
     
     // If the cluster centroid is dull (chroma < 15) but it contains a very colorful point (chroma > 40)
     // And the distance is significant
     const centroid = centroids[i];
     const centroidChroma = Math.sqrt(centroid.lab.a * centroid.lab.a + centroid.lab.b * centroid.lab.b);
     
     if (maxChromaPoint && maxChroma > 30 && centroidChroma < 20) {
         // This is likely an accent lost in a background cluster
         // Add this max chroma point as a candidate directly
         recallCandidates.push({
             hex: rgbToHex(maxChromaPoint.rgb),
             rgb: maxChromaPoint.rgb,
             lab: maxChromaPoint.lab,
             count: Math.ceil(cluster.length * 0.1), // Estimate count conservatively
             chroma: maxChroma
         });
     }
  });
  
  results.push(...recallCandidates);

  // Merge similar colors
  // Sort by count first to keep dominant versions
  results.sort((a, b) => b.count - a.count);

  const merged: typeof results = [];
  
  for (const r of results) {
    let added = false;
    for (const m of merged) {
      const dE = deltaE(r.lab, m.lab);
      
      // Dynamic merge threshold
      // If colors are dark (L < 20), we merge aggressively because eyes can't tell apart dark shades well.
      let threshold = 6;
      if (r.lab.l < 20 || m.lab.l < 20) {
          threshold = 12; // Much wider merge for dark colors
      }
      
      if (dE < threshold) {
          m.count += r.count;
          // If we merged a high chroma "recall" candidate into a dull one, 
          // we might want to keep the chroma one's properties? 
          // Usually the big dull one dominates. But if it's the accent we just recalled,
          // we don't want to lose it again.
          // BUT, if it merged, it means it was close to the dull one? 
          // If threshold is 12, maybe. But we recalled it because it was "far" from centroid.
          // Let's assume standard weighting.
          added = true;
          break;
      }
    }
    if (!added) merged.push(r);
  }

  // Intelligent Selection (Farthest Point Sampling weighted by count/chroma)
  // We want to pick 'targetCount' colors from 'merged'
  
  const finalSelection: typeof merged = [];
  
  // 1. Always take the most dominant color (Primary)
  merged.sort((a, b) => b.count - a.count);
  if (merged.length > 0) {
    finalSelection.push(merged[0]);
    merged.splice(0, 1);
  }

  // 2. Explicitly hunt for an Accent color (Highest Chroma)
  // We do this BEFORE the greedy loop to ensure the accent isn't skipped due to low count
  if (finalSelection.length < targetCount && merged.length > 0) {
     // Find the candidate with highest chroma
     let bestAccentIdx = -1;
     let maxChroma = -1;
     
     for (let i = 0; i < merged.length; i++) {
         const c = merged[i];
         // It must be somewhat distinct from the primary
         const dE = deltaE(c.lab, finalSelection[0].lab);
         
         if (dE > 10 && c.chroma > maxChroma) {
             maxChroma = c.chroma;
             bestAccentIdx = i;
         }
     }
     
     // If we found a decent accent candidate (chroma > 20 is usually "colorful")
     // Even if it's lower, if it's the most colorful thing in the image, we might want it.
     // But let's set a low bar to avoid picking gray noise as accent.
     if (bestAccentIdx !== -1 && maxChroma > 15) {
         finalSelection.push(merged[bestAccentIdx]);
         merged.splice(bestAccentIdx, 1);
     }
  }

  // 3. Iteratively pick the rest using the weighted score
  while (finalSelection.length < targetCount && merged.length > 0) {
    let bestScore = -1;
    let bestIdx = -1;

    for (let i = 0; i < merged.length; i++) {
      const candidate = merged[i];
      
      // Calculate min distance to any already selected color
      let minDist = Infinity;
      for (const selected of finalSelection) {
        const d = deltaE(candidate.lab, selected.lab);
        if (d < minDist) minDist = d;
      }
      
      // If it's too close to an existing color, penalty is huge
      if (minDist < 5) { // Relaxed from 8 to 5 to allow analogous colors if needed
          continue; 
      }

      const countScore = Math.log(candidate.count + 1);
      const chromaScore = 1 + (candidate.chroma / 20); 
      
      // Weighted score
      const score = minDist * countScore * chromaScore;

      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    // If we found a good candidate
    if (bestIdx !== -1) {
      finalSelection.push(merged[bestIdx]);
      merged.splice(bestIdx, 1);
    } else {
      // If no candidate satisfies the "too close" check
      // Pick the one with the best distance, ignoring count/chroma
      let bestDist = -1;
      let fallbackIdx = -1;
      
      for(let i=0; i<merged.length; i++) {
          let minDist = Infinity;
          for (const s of finalSelection) minDist = Math.min(minDist, deltaE(merged[i].lab, s.lab));
          if (minDist > bestDist) {
              bestDist = minDist;
              fallbackIdx = i;
          }
      }
      
      if (fallbackIdx !== -1) {
         finalSelection.push(merged[fallbackIdx]);
         merged.splice(fallbackIdx, 1);
      } else {
         // Should not happen unless merged is empty
         break;
      }
    }
  }

  const finalColors = finalSelection;
  
  // Calculate total pixels for percentage (based on final selection only, relative)
  // Or relative to original image? Usually relative to the palette is cleaner.
  const totalPixels = finalColors.reduce((sum, c) => sum + c.count, 0);

  // --- Assign Roles Logic ---
  // Helper to get chroma
  const getChroma = (lab: Lab) => Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const getHue = (lab: Lab) => Math.atan2(lab.b, lab.a) * (180 / Math.PI);
  
  // Pool of available colors
  let pool = finalColors.map(c => ({
    ...c,
    chroma: getChroma(c.lab),
    hue: getHue(c.lab)
  }));
  
  const assigned: (typeof pool[0] & { role: string })[] = [];
  
  // 1. Pick Primary (主色) - Essential
  // Strategy: Highest count, but prefer medium lightness/chroma
  pool.sort((a, b) => b.count - a.count); // Default sort by count
  
  let pIdx = -1;
  // Try to find a balanced color
  for(let i=0; i<pool.length; i++) {
     const c = pool[i];
     const isMediumSat = c.chroma > 10;
     const isMediumLight = c.lab.l > 15 && c.lab.l < 90;
     if (isMediumSat && isMediumLight) {
         pIdx = i;
         break;
     }
  }
  if (pIdx === -1) pIdx = 0; // Fallback to most frequent
  
  const primary = pool[pIdx];
  assigned.push({ ...primary, role: '主色' });
  pool.splice(pIdx, 1);
  
  // 2. Pick Neutral (中性色) - Priority 2
  if (pool.length > 0) {
     // Lowest chroma
     pool.sort((a, b) => a.chroma - b.chroma);
     const neutral = pool[0];
     assigned.push({ ...neutral, role: '中性色' });
     pool.splice(0, 1);
  }
  
  // 3. Pick Accent (强调色) - Priority 3
  if (pool.length > 0) {
     // Highest chroma
     pool.sort((a, b) => b.chroma - a.chroma);
     const accent = pool[0];
     assigned.push({ ...accent, role: '强调色' });
     pool.splice(0, 1);
  }
  
  // 4. Pick Secondary (辅助色) - Priority 4 & 5 (Max 2)
  const primaryHue = primary.hue;
  const getHueDiff = (h1: number, h2: number) => {
      let diff = Math.abs(h1 - h2);
      if (diff > 180) diff = 360 - diff;
      return diff;
  };
  
  const maxSecondaries = 2;
  let secondaryCount = 0;
  
  while (pool.length > 0 && secondaryCount < maxSecondaries) {
      // Sort by hue diff to primary (closest first)
      pool.sort((a, b) => getHueDiff(a.hue, primaryHue) - getHueDiff(b.hue, primaryHue));
      
      const sec = pool[0];
      assigned.push({ ...sec, role: '辅助色' });
      pool.splice(0, 1);
      secondaryCount++;
  }
  
  // 5. Rest are Supplementary (补充色)
  while (pool.length > 0) {
      const supp = pool[0];
      assigned.push({ ...supp, role: '补充色' });
      pool.splice(0, 1);
  }
  
  // Final Sort for Display
  const roleOrder: Record<string, number> = {
      '主色': 0,
      '中性色': 1,
      '强调色': 2,
      '辅助色': 3,
      '补充色': 4
  };
  
  assigned.sort((a, b) => (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99));

  return assigned.map(c => ({
    hex: c.hex,
    rgb: c.rgb,
    lab: c.lab,
    percentage: Math.round((c.count / totalPixels) * 100),
    role: c.role
  }));
}
