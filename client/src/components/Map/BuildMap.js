import React, { useEffect, useContext, useState } from "react";
import ReactDOM from "react-dom";
// import "../../../node_modules/mapbox-gl/dist/mapbox-gl.css";
import { accessToken, mapStyle } from "../../config";
import mapboxgl from "mapbox-gl";
import InfoPopup from "./PopupForm/InfoPopup";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
// import { SetLngLatContext } from "./LngLatContext";
import { MapContext } from "../../MapContextProvider";

mapboxgl.accessToken = accessToken;
const primary_color = "#11b4da"; //update
const secondary_color = "#fff"; //update
// must have odd number of entries. Color, number, color, etc. Same for radius scale
const circle_color_scale = [
  "#B49EDC",
  50,
  "#C5EBFE",
  250,
  "#A5F8CE",
  750,
  "#FFFD98",
  3000,
  "#FEC9A7",
  15000,
  "#F297C0",
];
// change radius to a step function - LATER
const circle_radius_scale = [
  10,
  50,
  15,
  250,
  20,
  750,
  25,
  3000,
  30,
  15000,
  35,
  50000,
  40,
];

export default function BuildMap({
  // mapbox,
  // setMapbox,
  setMapboxLoaded,
  markerInst,
  setLngLat,
}) {
  const {
    mapData,
    setMapDataUpdated,
    mapDataUpdated,
    setMapLayers,
    mapbox,
    setMapbox,
  } = useContext(MapContext);
  const [mapSource, setMapSource] = useState(null);

  const clusterLayer = {
    id: "clusters",
    type: "circle",
    source: "fruitfall",
    filter: ["has", "point_count"],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      "circle-color": ["step", ["get", "point_count"], ...circle_color_scale],
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
      "circle-radius": ["step", ["get", "point_count"], ...circle_radius_scale],
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        0.7,
      ],
    },
  };
  const clusterCountLayer = {
    id: "cluster-count",
    type: "symbol",
    source: "fruitfall",
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
      "text-size": 14,
      // "text-color": '#FFFFFF',
    },
  };
  const pointLayer = {
    id: "unclustered-point",
    type: "circle",
    source: "fruitfall",
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": primary_color,
      "circle-radius": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        6,
        4,
      ],
      "circle-stroke-width": 1,
      "circle-stroke-color": secondary_color,
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        1,
        0.7,
      ],
    },
  };

  const loadMap = (map) => {
    console.log("hits loadMap");
    console.log(map);
    console.log(mapData);

    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      mapboxgl: mapboxgl,
      marker: false,
    });
    map.addControl(geocoder);
    geocoder.on("result", ({ result }) => {
      const el = document.createElement("div");
      el.className = "marker";
      const marker = new mapboxgl.Marker(el, { draggable: true });
      marker.setLngLat(result.center).addTo(map);
      // clear previous marker if it exists
      if (markerInst.current) {
        markerInst.current.remove();
      }
      markerInst.current = marker;
      //this will fill in whatever result user clicks on
      // setLngLatState(result.center[0], result.center[1]);
      setLngLat(result.center[0], result.center[1]);
      marker.on("dragend", (e) => {
        const coordinates = e.target.getLngLat();
        setLngLat(coordinates.lng, coordinates.lat);
      });
    });

    // Add a new source from our GeoJSON data and
    // set the 'cluster' option to true. GL-JS will
    // add the point_count property to your source data.
    map.addSource("fruitfall", {
      type: "geojson",
      data: mapData, //"./locations_MN.geojson", //change this to come from database
      cluster: true,
      clusterMaxZoom: 14, // Max zoom to cluster points on
      clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
      // promoteId: 'id'//this moves id from properties into feature id - but it breaks clusters!
      generateId: true, //will this work for clusters and unclustered-points??? YES!
    });

    map.addLayer(clusterLayer);

    map.addLayer(clusterCountLayer);

    map.addLayer(pointLayer);

    // inspect a cluster on click
    map.on("click", "clusters", function (e) {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      const clusterId = features[0].properties.cluster_id;
      map
        .getSource("fruitfall")
        .getClusterExpansionZoom(clusterId, function (err, zoom) {
          if (err) return;
          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom,
          });
        });
    });

    // Open a popup on click of unclustered-point
    map.on("click", "unclustered-point", async function (e) {
      const coordinates = e.features[0].geometry.coordinates.slice();
      // get id from click
      const id = parseInt(e.features[0].properties.id, 10);
      // fetch popup info to display
      const res = await fetch(`/api/features/${id}`);
      const { properties } = await res.json();
      // Ensure that if the map is zoomed out such that
      // multiple copies of the feature are visible, the
      // popup appears over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      addPopup(map, coordinates, properties);
    });

    // start cluster hover features----------------
    let featureId = null;
    map.on("mousemove", "clusters", function (e) {
      map.getCanvas().style.cursor = "pointer";
      if (e.features.length > 0) {
        if (featureId) {
          map.removeFeatureState({
            source: "fruitfall",
            id: featureId,
          });
        }
        featureId = e.features[0].id;
        map.setFeatureState(
          {
            source: "fruitfall",
            id: featureId,
          },
          {
            hover: true,
          }
        );
      }
    });

    map.on("mouseleave", "clusters", function () {
      map.getCanvas().style.cursor = "";
      if (featureId) {
        map.setFeatureState(
          {
            source: "fruitfall",
            id: featureId,
          },
          {
            hover: false,
          }
        );
      }
      featureId = null;
    });
    // end cluster hover features--------------

    // start unclustered point hover features---------------
    map.on("mousemove", "unclustered-point", function (e) {
      map.getCanvas().style.cursor = "pointer";
      if (e.features.length > 0) {
        if (featureId) {
          map.removeFeatureState({
            source: "fruitfall",
            id: featureId,
          });
        }
        featureId = e.features[0].id;
        map.setFeatureState(
          {
            source: "fruitfall",
            id: featureId,
          },
          {
            hover: true,
          }
        );
      }
    });

    map.on("mouseleave", "unclustered-point", function () {
      map.getCanvas().style.cursor = "";
      if (featureId) {
        map.setFeatureState(
          {
            source: "fruitfall",
            id: featureId,
          },
          {
            hover: false,
          }
        );
      }
      featureId = null;
    });
    // end unclustered point hover features----------------
    // moved to use effect below - not sure if it'll fix "layer DNE in map's style and cannot be styled"
    // setMapboxLoaded(true);
    // hopefully this fixes it
    // map.on("style.load", () => {
    //   const waiting = () => {
    //     console.log(map.isStyleLoaded());
    //     if (!map.isStyleLoaded()) {
    //       setTimeout(waiting, 200);
    //     } else {
    //       setMapboxLoaded(true);
    //     }
    //   };
    //   waiting();
    // });
  };

  const addPopup = (map, coordinates, info) => {
    const placeholder = document.createElement("div");
    const popup = <InfoPopup info={info} />;
    ReactDOM.render(popup, placeholder);
    new mapboxgl.Popup({ closeButton: false })
      .setDOMContent(placeholder)
      .setLngLat(coordinates)
      .addTo(map);
  };
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(() => count + 1);
    console.log(count);
    if (count <= 1) {
      const map = new mapboxgl.Map({
        container: "mapbox",
        style: mapStyle,
        center: [-94.6859, 46.5],
        zoom: 5,
        movingMethod: "easeTo",
        pitchWithRotate: false,
        dragRotate: false,
        touchZoomRotate: false,
      });
      setMapbox(map);
      map.on("load", () => loadMap(map));
    } else {
      const clusters1 = mapbox.getLayer("clusters");
      console.log("clusters1:", clusters1);
      // mapbox.removeLayer("clusters");
      // mapbox.removeLayer("cluster-count");
			// mapbox.removeLayer("unclustered-point");
			// need to update layers on source change
      mapbox.getSource("fruitfall").setData(Object.assign({},mapData));
      // console.log(mapData);
      // console.log(mapbox.getSource("fruitfall"));
      // console.log(mapbox.getSource("fruitfall")._options);
      // mapbox.getSource("fruitfall")._options.data = mapData;
      // console.log(mapbox.getSource("fruitfall")._options);

      // mapbox.addLayer(clusterLayer);
      // mapbox.addLayer(clusterCountLayer);
      // mapbox.addLayer(pointLayer);
      // const clusters2 = mapbox.getLayer("clusters");
      // console.log("clusters2:", clusters2);
    }
    setMapboxLoaded(true);
  }, [mapData]);

  // useEffect(() => {
  //   // the parent component creates the mapbox container which is required to create a map. We trigger this on mapdata change
  //   if (mapbox) {
  //     console.log(mapbox);
  //     console.log(mapData);
  //     let mapDataCopy = { ...mapData };
  //     const featureCopy = [...mapData.features];
  //     console.log(featureCopy);
  //     // let map = mapbox;
  //     // if (map === null) {
  //     console.log(featureCopy);
  //     // }
  //     mapbox.on("style.load", () => {
  //       const source = mapbox.getSource("fruitfall");
  //       console.log(source);
  //       console.log("style loaded???");
  //     }); //setMapboxLoaded(true));
  //     // map.on("load", () => loadMap(map));
  //     // map.getSource("fruitfall").setData(mapData);

  //     // look into docs for events - docs/API are not perfect. DIscussion below.
  //     // https://gis.stackexchange.com/questions/240134/mapbox-gl-js-source-loaded-event
  //     // https://github.com/mapbox/mapbox-gl-js/issues/6707

  //     setMapboxLoaded(true);
  //   }
  // }, [mapData]);

  // useEffect(() => {
  //   if (mapbox && mapDataUpdated) {
  //     mapbox.getSource("fruitfall").setData(mapData);
  //     setMapboxLoaded(true);
  //   }
  // }, [mapDataUpdated]);

  return null;
}
