/** Converts pointer coordinates on the map container to LatLng. */
export function createMapProjectionHelper(
  map: google.maps.Map
): Promise<{
  fromContainerPixel: (x: number, y: number) => google.maps.LatLng | null;
  dispose: () => void;
}> {
  return new Promise((resolve) => {
    const overlay = new google.maps.OverlayView();
    overlay.onAdd = function onAdd() {
      const projection = overlay.getProjection();
      resolve({
        fromContainerPixel(x, y) {
          if (!projection) return null;
          return projection.fromContainerPixelToLatLng(
            new google.maps.Point(x, y)
          );
        },
        dispose() {
          overlay.setMap(null);
        },
      });
    };
    overlay.draw = function draw() {};
    overlay.setMap(map);
  });
}

export function clientPointToContainerPixel(
  map: google.maps.Map,
  clientX: number,
  clientY: number
): { x: number; y: number } | null {
  const rect = map.getDiv().getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return null;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

export function isPointerOverMap(
  map: google.maps.Map,
  clientX: number,
  clientY: number
): boolean {
  return clientPointToContainerPixel(map, clientX, clientY) != null;
}
