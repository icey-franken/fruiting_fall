import React, { useState } from "react";
import ReactDOM from "react-dom";
// import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import { accessToken, mapStyle } from "../.././config";
import ReactMapboxGl, { Layer, Feature, Source, Popup } from "react-mapbox-gl";
import mapboxgl from "mapbox-gl";
import InfoPopup from "./InfoPopup";

export default function MapMain() {
  const [viewport, setViewport] = useState({
    center: [-94.6859, 46.5],
    zoom: [5],
    movingMethod: "easeTo",
    // maxBounds: [[-98,43.2], [-89.5, 50]]  //I don't care about maxBounds - look whereever you please, data is only in mn
  });

  function loadStuff(map) {
    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
    map.addSource("earthquakes", {
      type: "geojson",
      data: "./locations_MN.geojson", //change this to come from database
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
    });

    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "earthquakes",
      filter: ["has", "point_count"],
      paint: {
        // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
        // with three steps to implement three types of circles:
        //   * Blue, 20px circles when point count is less than 100
        //   * Yellow, 30px circles when point count is between 100 and 750
        //   * Pink, 40px circles when point count is greater than or equal to 750
        "circle-color": [
          "step",
          ["get", "point_count"],
          "#9400D3",
          10,
          "#4B0082",
          50,
          "#0000FF",
          100,
          "#00FF00",
          500,
          "#FFFF00",
          1000,
          "#FF7F00",
          5000,
          "#FF0000",
        ],
        // original circle color
        // "circle-color": [
        //   "step",
        //   ["get", "point_count"],
        //   "#51bbd6",
        //   100,
        //   "#f1f075",
        //   750,
        //   "#f28cb1",
        // ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          5,
          10,
          10,
          50,
          15,
          100,
          20,
          500,
					25,
					1000,
					30,
					5000,
					35,
					10000,
					40,
					25000,
					45,
					50000,
					50,
        ],
        "circle-opacity": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          1,
          0.7,
        ],
      },
    });

    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "earthquakes",
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
				"text-size": 14,
				// "text-color": '#FFFFFF',
      },
    });

    map.addLayer({
      id: "unclustered-point",
      type: "circle",
      source: "earthquakes",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": "#11b4da",
        "circle-radius": 4,
        "circle-stroke-width": 1,
        "circle-stroke-color": "#fff",
      },
    });

    // inspect a cluster on click
    map.on("click", "clusters", function (e) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource("earthquakes")
        .getClusterExpansionZoom(clusterId, function (err, zoom) {
          if (err) return;

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
    });

    // When a click event occurs on a feature in
    // the unclustered-point layer, open a popup at
    // the location of the feature, with
    // description HTML from its properties.
    map.on("click", "unclustered-point", function (e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      // change this to the info - the popup will be an info component
      const mag = e.features[0].properties;
      let tsunami;

      if (e.features[0].properties.tsunami === 1) {
        tsunami = "yes";
      } else {
        tsunami = "no";
      }

      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      addPopup(map, coordinates, mag);
    });
    // start cluster hover features------------------------------------
    // me freeballin

    let clusterId = null;

    map.on("mousemove", "clusters", function (e) {
      map.getCanvas().style.cursor = "pointer";
      if (e.features.length > 0) {
        if (clusterId) {
          map.removeFeatureState({
            source: "earthquakes",
            id: clusterId,
          });
        }
        clusterId = e.features[0].id;
        map.setFeatureState(
          {
            source: "earthquakes",
            id: clusterId,
          },
          {
            hover: true,
          }
        );
      }
    });

    map.on("mouseleave", "clusters", function () {
      map.getCanvas().style.cursor = "";
      if (clusterId) {
        map.setFeatureState(
          {
            source: "earthquakes",
            id: clusterId,
          },
          {
            hover: false,
          }
        );
      }
      clusterId = null;
    });

    // // OG enter/leave for clusters
    // map.on("mouseenter", "clusters", function () {
    //   map.getCanvas().style.cursor = "pointer";
    // });

    // map.on("mouseleave", "clusters", function () {
    //   map.getCanvas().style.cursor = "";
    // });
    //end cluster hover features-----------------------
  }

  const addPopup = (map, coordinates, info) => {
    const placeholder = document.createElement("div");
    const popup = <InfoPopup info={info} />;
    ReactDOM.render(popup, placeholder);
    new mapboxgl.Popup({ closeButton: false })
      .setDOMContent(placeholder)
      .setLngLat(coordinates)
      .addTo(map);
  };

  const Map = ReactMapboxGl({ accessToken });

  return (
    <Map
      className="mapbox"
      style={mapStyle}
      onStyleLoad={loadStuff}
      onViewportChange={setViewport}
      {...viewport}
      // renderChildrenInPortal={true}
    />
  );
}