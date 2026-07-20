import type { Cluster, ClusterStats, Marker } from "@googlemaps/markerclusterer";

const BETA_TEAL = "#3E6F7E";

function clusterSize(count: number): number {
  if (count < 10) return 38;
  if (count < 25) return 44;
  return 50;
}

function createClusterSvg(count: number, size: number): string {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;
  const fontSize = count >= 100 ? 11 : count >= 10 ? 12 : 13;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${BETA_TEAL}" stroke="#ffffff" stroke-width="2"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
      fill="#ffffff" font-family="proxima-nova, system-ui, sans-serif"
      font-size="${fontSize}" font-weight="700">${count}</text>
  </svg>`;
}

export function createBetaClusterRenderer() {
  return {
    render: (
      { count, position }: Cluster,
      _stats: ClusterStats,
      _map: google.maps.Map
    ): Marker => {
      const size = clusterSize(count);
      const svg = createClusterSvg(count, size);

      return new google.maps.Marker({
        position,
        zIndex: Number(google.maps.Marker.MAX_ZINDEX) + count,
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
          scaledSize: new google.maps.Size(size, size),
          anchor: new google.maps.Point(size / 2, size / 2),
        },
        title: `${count} tenants`,
        optimized: false,
      });
    },
  };
}
