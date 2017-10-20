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

/* SMR 2017-04-19
_renderOwnerAndDate function updated to display one of revision, creation, publication, or metadataUpdate dates in that order of preference.
*/

define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/string",
        "dojo/topic",
        "dojo/request/xhr",
        "app/context/app-topics",
        "dojo/dom-class",
        "dojo/dom-construct",
        "dijit/_WidgetBase",
        "dijit/_TemplatedMixin",
        "dijit/_WidgetsInTemplateMixin",
        "dijit/Tooltip",
        "dojo/text!./templates/ItemCard.html",
        "dojo/i18n!app/nls/resources",
        "app/context/AppClient",
        "app/etc/ServiceType",
        "app/etc/util",
        "app/common/ConfirmationDialog",
        "app/content/ChangeOwner",
        "app/content/MetadataEditor",
        "app/context/metadata-editor",
        "app/content/UploadMetadata"],
    function (declare, lang, array, string, topic, xhr, appTopics, domClass, domConstruct,
        _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Tooltip, template, i18n,
        AppClient, ServiceType, util, ConfirmationDialog, ChangeOwner,
        MetadataEditor, gxeConfig, UploadMetadata) {

        var oThisClass = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {

            i18n: i18n,
            templateString: template,

            isItemCard: true,
            item: null,
            itemsNode: null,
            searchPane: null,

            allowedServices: {
                "featureserver": "agsfeatureserver",
                "imageserver": "agsimageserver",
                "mapserver": "agsmapserver",
                "csw": "csw",
                "ims": "image",
                "sos": "sos",
                "wcs": "wcs",
                "wfs": "wfs",
                "wms": "wms"
            },

            postCreate: function () {
                this.inherited(arguments);
                var self = this;
                topic.subscribe(appTopics.ItemOwnerChanged, function (params) {
                    if (self.item && self.item === params.item) {
                        self._renderOwnerAndDate(self.item);
                    }
                });
              }
            });
          }
        }));
      }
      
      if (isAdmin) {
        links.push(domConstruct.create("a",{
          "class": "small",
          href: "javascript:void(0)",
          innerHTML: i18n.item.actions.options.changeOwner,
          onclick: function() {
            var dialog = new ChangeOwner({item:item});
            dialog.show();
          }
        }));
      }
      
      if (links.length === 0) return;
      
      var dd = domConstruct.create("div",{
        "class": "dropdown",
        "style": "display:inline-block;"
      },this.actionsNode);
      var ddbtn = domConstruct.create("a",{
        "class": "dropdown-toggle",
        "href": "#",
        "data-toggle": "dropdown",
        "aria-haspopup": true,
        "aria-expanded": true,
        innerHTML: i18n.item.actions.options.caption
      },dd);
      domConstruct.create("span",{
        "class": "caret"
      },ddbtn);
      var ddul = domConstruct.create("ul",{
        "class": "dropdown-menu",
      },dd);
      array.forEach(links,function(link){
        var ddli = domConstruct.create("li",{},ddul);
        ddli.appendChild(link);
      });
      this._mitigateDropdownClip(dd,ddul);
    },
    
/*    _renderOwnerAndDate: function(item) {
//      var owner = item.sys_owner_s;
//      var date = item.sys_modified_dt;
    	
        // smr 2017-04-19  modify so displays metadata record contact organization
    	//smr 2017-09-29 change to cited organization_s doesn't work from apiso_organization_txt
        var owner = item.apiso_OrganizationName_txt;
        // smr 2017-04-19 modify to show a citation date or the date stamp on the metadata record
        var date = "";
        
      var idx, text = "";
      if (AppContext.appConfig.searchResults.showDate && typeof date === "string" && date.length > 0) {
        idx = date.indexOf("T");
        if (idx > 0) date =date.substring(0,idx);
        text = date;
      }
      if (AppContext.appConfig.searchResults.showOwner && typeof owner === "string" && owner.length > 0) {
        if (text.length > 0) text += " ";
        text += owner;
      }
      if (text.length > 0) {
        util.setNodeText(this.ownerAndDateNode,text);
      }
    },*/
    
//smr 2017-10-20 replace with authors, dates, and 
    
    _renderOwnerAndDate: function(item) {

        var owner = item.cited_individual_s;
        var date = "";
        var dataCenter=item.src_source_name_s;
        var idx, text = "";

/*SMR 2017-10-12 modify to display the authors and creation date
* Authors (cited_individual_s apparently might be string or array
* have to handle both
*/                 
       if (Array.isArray(owner)){
        owner.forEach(function(element) {
          if (typeof element === "string") {
          if (text.length == 0  ) {
                text = "Authors: " + element;
            } else {
                text = text + ", " + element;
            };
        }})
        }
        else {
      	  if (typeof owner === "string" && owner.length > 0) {
                if (text.length > 0) text += " ";
                text = "Author: " + owner;
            }
        }
       
/*
* report publication date, if missing then Created date
* TODO-- put in release date first if that is available
* 
*/
       if (typeof item.apiso_PublicationDate_dt === "string" && item.apiso_PublicationDate_dt.length > 0){
      	 date = item.apiso_PublicationDate_dt;
      	 idx = date.indexOf("T");
           if (idx > 0) date =date.substring(0,idx);
           date = ";    Data release: " + date;
       }
       else if (typeof item.apiso_CreatedDate_dt === "string" && item.apiso_CreatedDate_dt.length > 0 ){
      	 date = item.apiso_CreatedDate_dt;
      	 idx = date.indexOf("T");
           if (idx > 0) date =date.substring(0,idx);
           date = ";    Created: " + date;
       }
               
        if (AppContext.appConfig.searchResults.showDate && typeof date === "string" && date.length > 0) {
            text += date; }
        
        /*
         * add partner system name SMR 2017-10-17
         */          
                  text += ";   Harvest source: " + dataCenter;
                  
                  if (text.length > 0) {
                      util.setNodeText(this.ownerAndDateNode,text);
                  }
    	
    },
    
    _renderThumbnail: function(item) {
      var show = AppContext.appConfig.searchResults.showThumbnails;
      var thumbnailNode = this.thumbnailNode;
      if (show && typeof item.thumbnail_s === "string" && item.thumbnail_s.indexOf("http") === 0) {
        setTimeout(function(){
          thumbnailNode.src = util.checkMixedContent(item.thumbnail_s);
        },1);
      } else {
        thumbnailNode.style.display = "none";
      }
      //thumbnailNode.src = "http://placehold.it/80x60";
    },
    
    
    //update to show distribution links, not all links
    _uniqueLinks: function(item) {
      var links = [];
      if (typeof item.distribution_links_s === "string") {
        links = [item.distribution_links_s];
      } else if (lang.isArray(item.distribution_links_s)) {
        array.forEach(item.distribution_links_s, function(u){
          if (links.indexOf(u) === -1) links.push(u);
        });
      }
      return links;
    },
    
    _renderServiceStatus: function(item) {
      var authKey = AppContext.appConfig.statusChecker.authKey;
      if (authKey && string.trim(authKey).length>0) {
        if (item && item.resources_nst) {
          if (item.resources_nst.length) {
            for (var i=0; i<item.resources_nst.length; i++) {
              var type = this._translateService(item.resources_nst[i].url_type_s);
              if (type) {
                this._checkService(item._id,type);
                break;
              }
            }
          } else {
            var type = this._translateService(item.resources_nst.url_type_s);
            if (type) {
              this._checkService(item._id,type);

            }

        });

        return oThisClass;
    });