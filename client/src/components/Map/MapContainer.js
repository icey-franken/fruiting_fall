import React, { useState, useRef, useEffect, useContext } from "react";
import BuildMap from "./BuildMap";
import AddLocationForm from "./LocationForm/AddLocationFormHook";
import { LngLatContext } from "./LngLatContext";
import mapboxgl from "mapbox-gl";
import { MapContext } from "../../MapContextProvider";

export default function MapContainerContainer() {
  const { lngLat } = useContext(LngLatContext);

  const { mapbox } = useContext(MapContext);
  // we pass relevant context value in here. This prevents entire mapcontainer component from rerendering because it's props (setLngLat) don't change!
  // if we have context directly in mapcontainer, then whenever lng or lat change the entire component (and all it's children) re-render as well. I also used React.memo on map container so that it checks for prop change, and if none - no re-render!
  return (
    <MapContainer
      setLngLat={lngLat.setLngLat}
      mapbox={mapbox}
    />
  );
}

const MapContainer = React.memo(({ setLngLat, mapbox }) => {
  // console.log("map container re-rendered");

  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);

  // useEffect(()=>{
  // 	console.log('hits map container use effect - mapboxLoaded')
  // }, [mapboxLoaded])

  // ---------------------------------------
  //canvas ref and the following effects/functions for changing cursor based on showAddLocation value. Crosshair functions used in mapClickFn

  const canvasRef = useRef();
  const markerInst = useRef();
  // useRef hook required so that we reference the SAME function in map.on and map.off in useEffect hook - otherwise click handlers not removed properly
  const mapClickFn = useRef((e) => {
    // remove marker from search result on click
    const geocoderMarker = e.target._controls[2].mapMarker;
    geocoderMarker && geocoderMarker.remove();
    // remove prev marker on click
    markerInst.current && markerInst.current.remove();
    const coordinates = e.lngLat;
    // set coords on click
    setLngLat(coordinates.lng, coordinates.lat);
    // create new marker on click
    const el = document.createElement("div");
    el.className = "marker";
    const marker = new mapboxgl.Marker(el, { draggable: true });
    marker.setLngLat(coordinates).addTo(e.target);
    // change cursor back to grabbing on drag
    marker.on("dragstart", () => {
      canvasRef.current.classList.remove("crosshair");
    });
    // update coords on drag
    marker.on("dragend", () => {
      const coordinates = marker.getLngLat();
      setLngLat(coordinates.lng, coordinates.lat);
      canvasRef.current.classList.add("crosshair");
    });
    // update marker instance to new marker
    markerInst.current = marker;
  });

  const handleAddLocationClick = () => setShowAddLocation(!showAddLocation);

  // toggle map layers and the map click effect based on show add location form state
  useEffect(() => {
    if (mapboxLoaded && canvasRef.current) {
      mapbox.flyTo({ center: [-94.6859, 46.5], zoom: 5 });
      if (showAddLocation) {
        mapbox.on("click", mapClickFn.current);
        mapbox.U.hideSource("fruitfall");
        canvasRef.current.classList.add("crosshair");
      } else {
        mapbox.off("click", mapClickFn.current);
        mapbox.U.showSource("fruitfall");
        canvasRef.current.classList.remove("crosshair");
        markerInst.current && markerInst.current.remove();
      }
    }
  }, [showAddLocation]);

  const closeForm = useRef(() => setShowAddLocation(false));
  useEffect(() => {
    function checkLoad() {
      if (mapbox && mapbox.loaded() && mapbox._loaded) {
        setMapboxLoaded(true);
      } else {
        setTimeout(checkLoad, 1000);
      }
    }
		checkLoad();
		return setMapboxLoaded(false) //button hidden on logout-login
  }, [mapbox]);

  return (
    <div className="content-cont">
      {mapboxLoaded ? ( //do this conditionally to reduce number of rerenders
        <div
          className={`add-loc__cont fade-in ${showAddLocation ? "show" : ""}`}
        >
          <div className="add-loc__close-cont">
            <div className="add-loc__close" onClick={handleAddLocationClick}>
              &#10006;
            </div>
          </div>
          <AddLocationForm closeForm={closeForm.current} />
        </div>
      ) : null}
      <div className="mapbox-cont">
        <button
          id="add-location-button"
          className={`btn add-location__btn ${
            (showAddLocation|| !mapboxLoaded) ? "add-location__btn--hide" : ""
          }`}
          disabled={showAddLocation}
          name={showAddLocation.toString()}
          onClick={handleAddLocationClick}
          // hide button until layers loaded
          // style={{ display: `${mapboxLoaded ? "" : "none"}` }}
        >
          Add Location
        </button>
        <BuildMap
          setLngLat={setLngLat}
          markerInst={markerInst}
          canvasRef={canvasRef}
        />
        <div id="mapbox" />
      </div>
    </div>
  );
});
