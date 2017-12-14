/* See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * Esri Inc. licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(){
  
  gs.target.elastic.GeoportalSchema = gs.Object.create(gs.target.elastic.ElasticSchema, {
    
    isVersion5Plus: {writable: true, value: true},
  
    bboxField: {writable: true, value: "envelope_geo"},
    pointField: {writable: true, value: "envelope_cen_pt"},
    
    modifiedPeriodInfo: {writable: true, value: {
      field: "sys_modified_dt",
      toField: null,
      nestedPath: null
    }},
    
    sortables: {writable: true, value: {
      "title": "title.sort",
      "title.sort": "title.sort",
      "date": "sys_modified_dt",
      "modified": "sys_modified_dt",
      "sys_modified_dt": "sys_modified_dt"
    }},
    
    spatialInfo: {writable: true, value: {
      field: "envelope_geo",
      type: "geo_shape" // geo_shape or geo_point
    }},
    
    timePeriodInfo: {writable: true, value: {
      field: "timeperiod_nst.begin_dt",
      toField: "timeperiod_nst.end_dt",
      nestedPath: "timeperiod_nst"
    }},
    
    typeAliases: {writable: true, value: {
      "FeatureServer": ["FeatureServer","Feature Service"], // indexed as either FeatureServer or Feature Service
      "Feature Service": ["FeatureServer","Feature Service"],
      "MapServer": ["MapServer","Map Service"],
      "Map Service": ["MapServer","Map Service"],
      "ImageServer": ["ImageServer","Image Service"],
      "Image Service": ["ImageServer","Image Service"],
      "GeocodeServer": ["GeocodeServer","Geocoding Service"],
      "Geocoding Service": ["GeocodeServer","Geocoding Service"],
      "GeoDataServer": ["GeoDataServer","Geodata Service"],
      "Geodata Service": ["GeoDataServer","Geodata Service"],
      "GeometryServer": ["GeometryServer","Geometry Service"],
      "Geometry Service": ["GeometryServer","Geometry Service"],
      "GlobeServer": ["GlobeServer","Globe Service"],
      "Globe Service": ["GlobeServer","Globe Service"],
      "GPServer": ["GPServer","Geoprocessing  Service"],
      "Geoprocessing  Service": ["GPServer","Geoprocessing  Service"],
      "NAServer": ["NAServer","Network Analysis Service"],
      "Network Analysis Service": ["NAServer","Network Analysis Service"],
      "SceneServer": ["SceneServer","Scene Service"],
      "Scene Service": ["SceneServer","Scene Service"],     
      "VectorTileServer": ["VectorTileServer","Vector Tile Service"],
      "Vector Tile Service": ["VectorTileServer","Vector Tile Service"],
      
      "kml": "KML", // indexed as upper case KML, this will make the url param case insensitive: type=kml
      "wms": "WMS",
      "wfs": "WFS",
      "wcs": "WCS",
      "wmts": "WMTS",
      "wps": "WPS",
      "sos": "SOS",
      "csw": "CSW",
      
      "ims": ["IMS","ArcIMS"],
      "arcims": ["IMS","ArcIMS"],
      
      "shp": ["shp","Shapefife"],
      "Shapefife": ["shp","Shapefife"],
      
      "liveData": ["FeatureServer","Feature Service",
                   "MapServer","Map Service",
                   "ImageServer","Image Service",
                   "SceneServer","Scene Service",
                   "VectorTileServer","Vector Tile Service",
                   "KML","WMS","WFS","WCS","WMTS"]
    }},
    
    typeInfo: {writable: true, value: {
      field: "resources_nst.url_type_s",
      nestedPath: "resources_nst"
    }},
    
    buildAtomCategories: {value: function(task,item) {
      var categories = [], source = item["_source"];
      var itemType = task.val.chkStr(source["itemType_s"]);
      var keywords = task.val.chkStrArray(source["keywords_s"]);
      if (itemType !== null && itemType.length > 0) {
        categories.push(gs.Object.create(gs.atom.Category).init({
          scheme: "type",
          term: itemType
        }));
      }
      if (Array.isArray(keywords)) {
        keywords.forEach(function(v){
          v = task.val.chkStr(v);
          if (v !== null && v.length > 0) {
            categories.push(gs.Object.create(gs.atom.Category).init({
              scheme: "keywords",
              term: v
            }));
          }
        });
      }
      return categories;
    }},
    
    buildAtomLinks: {value: function(task,item) {
      var links = [], serviceType, url;
      var id = item["_id"], source = item["_source"];
      
      var searchUrl, baseUrl, idx;
      if (task.target && task.target.searchUrl) {
        var searchUrl = task.target.searchUrl;
        var idx = searchUrl.indexOf("/elastic/");
        if (idx > 0) {
          baseUrl = searchUrl.substring(0,idx);
          var itemUrl = baseUrl+"/rest/metadata/item/"+encodeURIComponent(id);
          
          var jsonUrl = itemUrl;
          links.push(gs.Object.create(gs.atom.Link).init({
            rel: "alternate.json",
            type: "application/json",
            href: jsonUrl
          }));
          if (item["sys_metadatatype_s"] !== "json") {
            var htmlUrl = itemUrl+"/html";
            links.push(gs.Object.create(gs.atom.Link).init({
              rel: "alternate.html",
              type: "text/html",
              href: htmlUrl
            }));
            var xmlUrl = itemUrl+"/xml";
            links.push(gs.Object.create(gs.atom.Link).init({
              rel: "alternate.xml", // TODO via???
              type: "application/xml",
              href: xmlUrl
            }));
          }
        }
      }
      
      var resources = source["resources_nst"];
      if (!Array.isArray(resources)) resources = [resources];
      resources.forEach(function(resource){
        if (resource) {
          url = task.val.chkStr(resource.url_s);
          //console.log(resource.url_type_s,resource.url_s);
          if (url !== null && url.length > 0) {
            serviceType = task.val.chkStr(resource.url_type_s);
            if (serviceType === null || serviceType.length === 0) {
              serviceType = ""; // TODO?
            }
            links.push(gs.Object.create(gs.atom.Link).init({
              rel: "related", // TODO?
              //type: serviceType, // TODO link.type vs link.scheme
              href: url
            }));
          }
        }
      });

      return links;
    }},
    
    itemToAtomEntry: {value: function(task,item) {
      //console.log("GeoportalSchema::itemToAtomEntry");
      var source = item["_source"];
      var entry = gs.Object.create(gs.atom.Entry);
      entry.id = item["_id"];
      entry.title = task.val.chkStr(source["title"]);
      entry.published = task.val.chkStr(source["sys_created_dt"]);
      entry.updated = task.val.chkStr(source["sys_modified_dt"]);
      entry.category = this.buildAtomCategories(task,item);
      entry.link = this.buildAtomLinks(task,item);
      
      var summary = task.val.chkStr(source["description"]);
      if (summary !== null && summary.length > 0) {
        entry.summary = gs.Object.create(gs.atom.Text).init({
          type: "text",
          value: summary
        });
      }
      
      var author = task.val.chkStrArray(source["sys_owner_s"]);
      if (Array.isArray(author)) {
        author.forEach(function(v){
          v = task.val.chkStr(v);
          if (v !== null && v.length > 0) {
            if (!entry.author) entry.author = [];
            entry.author.push(gs.Object.create(gs.atom.Person).init({
              tag: "author",
              name: v
            }));
          }
        });
      }
      
      var credits = task.val.chkStrArray(source["credits_s"]);
      if (Array.isArray(credits)) {
        credits.forEach(function(v){
          v = task.val.chkStr(v);
          if (v !== null && v.length > 0) {
            if (!entry.contributor) entry.contributor = [];
            entry.contributor.push(gs.Object.create(gs.atom.Person).init({
              tag: "contributor",
              name: v
            }));
          }
        });
      }
      
      var rights = task.val.chkStrArray(source["rights_s"]);
      if (Array.isArray(rights)) {
        rights.forEach(function(v){
          v = task.val.chkStr(v);
          if (v !== null && v.length > 0) {
            if (!entry.rights) entry.rights = [];
            entry.rights.push(gs.Object.create(gs.atom.Text).init({
              type: "text",
              value: v
            }));
          }
        });
      }
  
      if (this.bboxField) {
        var extent = source[this.bboxField];
        if (extent && extent.type && extent.type === "envelope" && 
            extent.coordinates && extent.coordinates.length === 2) {
          var topLeft = extent.coordinates[0];
          var bottomRight = extent.coordinates[1];
          if (topLeft != null && topLeft.length === 2 && 
              bottomRight != null && bottomRight.length === 2) {
            entry.bbox = gs.Object.create(gs.atom.BBox).init({
              xmin : topLeft[0],
              ymin : bottomRight[1],
              xmax : bottomRight[0],
              ymax : topLeft[1]
            });
          }
        }      
      }
  
      if (this.pointField) {
        var point = source[this.pointField];
        if (point && typeof point.lon === "number" && typeof point.lat === "number") {
          entry.point = gs.Object.create(gs.atom.Point).init({
            x : point.lon,
            y : point.lat
          });
        }
      }
  
      return entry;
    }},
    
    itemToJson: {value: function(task,item) {
      return item;
    }}
  
  });

}());

