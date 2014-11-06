/*
 * Copyright 2013 The Broad Institute, Inc.
 * SOFTWARE COPYRIGHT NOTICE
 * This software and its documentation are the copyright of the Broad Institute, Inc. All rights are reserved.
 *
 * This software is supplied without any warranty or guaranteed support whatsoever. The Broad Institute is not responsible for its use, misuse, or functionality.
 */

$.widget("gp.module", {
    // default options
    options: {
        display: true,
        data: {},
        draggable: true,

        // callbacks
        click: function() {},
        tagclick: function(event) {
            $('#module-search')
                .searchslider('show')
                .searchslider('tagfilter', $(event.currentTarget).text())
                .searchslider('set_title', '<a href="#" onclick="$(\'#module-browse\').searchslider(\'show\');">Browse Modules</a> &raquo; ' + $(event.currentTarget).text());
            $(event.currentTarget)
                .closest('.module-listing')
                .module('stopProp', event);
        }
    },

    // the constructor
    _create: function() {
        this.element.addClass('module-listing');

        // Add the ui elements
        if (this.options.data.lsid) {
            this.gear = $('<img src="/gp/images/gear.png" />')
                .css("height", "15px")
                .attr("class", "module-gear")
                .attr("title", "Module Options")
                .attr("onclick", "$(this).parent().module('showMenu').module('stopProp', event)")
                .appendTo(this.element);
        }

        // Build the menu
        this.menu = $('<ul></ul>')
            .css("display", "none")
            .attr("class", "module-menu")
            .appendTo(this.element);

        if (this.options.data.documentation) {
            this.doc = $('<a>Documentation</a>')
                .attr("href", this._protect(this.options.data.documentation, ""))
                .attr("target", "_blank")
                .attr("onclick", "$(this).closest('.module-listing').module('stopProp', event)")
                .appendTo(this.menu[0])
                .wrap("<li/>");
        }

        this.expandModule = $('<a>Expand</a>')
            .attr("href", "#")
            .attr("onclick", "$(this).closest('.module-listing').module('expand').module('stopProp', event)")
            .appendTo(this.menu[0])
            .wrap("<li/>");

        this.removeFavorite = $('<a>Remove Favorite</a>')
            .attr("href", "#")
            .attr("onclick", "$(this).closest('.module-listing').module('remove').module('stopProp', event)")
            .appendTo(this.menu[0])
            .wrap("<li class='module-remove' />");

        // Init the menu UI component
        this.menu.menu();

        this.version = $('<div>', {
            'class': 'module-version',
            'html': /^\d.*/.test(this.options.data.version) ? 'v'+ this.options.data.version : this.options.data.version
        }).appendTo(this.element);

        this.name = $('<div>', {
            'class': 'module-name',
            'html': this._protect(this.options.data.name, "UNNAMED")
        }).appendTo(this.element);

        // Save the lsid
        this.lsid = this._protect(this.options.data.lsid, "");
        this.lsidBox = $('<div>', {
            'class': 'module-lsid',
            'text': this.lsid
        }).appendTo(this.element);

        this.description = $('<div>', {
            'class': 'module-description',
            'text': this._protect(this.options.data.description, "")
        }).appendTo(this.element);

        this.tags = $('<div>', {
            'class': 'module-tag'
        }).appendTo(this.element);

        // Add tag links
        this.all_tags_raw = [];
        $.merge(this.all_tags_raw, this._protect(this.options.data.categories, []));
        $.merge(this.all_tags_raw, this._protect(this.options.data.suites, []));
        $.merge(this.all_tags_raw, this._protect(this._getTags(this.options.data.tags), []));
        this._makeTags();

        if (!this.options.display) {
            this.element.hide();
        }

        if (this.options.draggable) {
            var module = this;
            this.element.draggable({
                helper:'clone',
                connectToSortable:'#pinned-modules',
                scroll: false,
                start: function(event, ui) {
                    ui.helper.data('dropped', false);
                },
                stop: function(event, ui) {
                    if (ui.helper.data('dropped') !== false) {
                        // This means the module has been dropped into pinned modules, do something
                        // TODO: Implement the ajax callback to save pinned modules here
                    }  
                }
            });
        }
        else {
        	$(this.element).mousedown(function() {
        	    $(window).mousemove(function() {
        	        $("body").css( 'cursor', 'no-drop' );
        	        $("body").addClass("disable-select");
        	        $(".module-listing").css( 'cursor', 'no-drop' );
        	        $(window).unbind("mousemove");
        	    });
        	})
        	.mouseup(function() {
        		$("body").css('cursor', '');
        		$("body").removeClass("disable-select");
    	        $(".module-listing").css('cursor', '');
        	    $(window).unbind("mousemove");
        	})
        	.mouseout(function() {
        		$(window).mouseup(function() {
        			$("body").css('cursor', '');
            		$("body").removeClass("disable-select");
        	        $(".module-listing").css('cursor', '');
            	    $(window).unbind("mousemove");
        	        $(window).unbind("mouseup");
        	    });
        	});
        }

        // bind events on the widget
        this._on(this.element, {
        	click: function(event) {
            	if (!$(this.element).hasClass('noclick')) {
            		this.options.click(event);
            	}
            }
        });
    },

    _makeTags: function() {
        var all_tags = [];
        $.each(this.all_tags_raw, function(i, el) { // Remove duplicates
            if($.inArray(el, all_tags) === -1) all_tags.push(el);
        });
        all_tags.sort(); // Sort

        for (var i = 0; i < all_tags.length; i++) {
            all_tags[i] = $("<div>").append($('<a>', {
                'class': 'tag',
                'text': all_tags[i],
                'href': '#'})
                .attr("onclick", "$(this).closest('.module-listing').module('tagClick', event);")).html();
        }

        this.tags.append(all_tags.join(", "));
    },
    
    _getTags: function(tagObjList) {
    	var tagList = [];
    	for (var i = 0; i < tagObjList.length; i++) {
    		tagList.push(tagObjList[i].tag);
    	}
    	return tagList;
    },
    
    _protect: function(string, blankReturn) {
    	if (string === null || string === undefined) {
    		return blankReturn;
    	}
    	else {
    		return string;
    	}
    },

    _isValid: function(toElement) {
        if (!toElement) return false;
        var modlist = $(toElement).closest(".module-list");
        if (modlist.length < 1) return false;
        return $(modlist[0]).hasClass("ui-sortable");
    },

    add_tag: function(tag) {
        this.tags.empty();
        $.merge(this.all_tags_raw, [tag]);
        this._makeTags();
    },

    remove_tag: function(tag) {
        this.tags.empty();
        this.all_tags_raw = $.grep(this.all_tags_raw, function(value) {
            return value !== tag;
        });
        this._makeTags();
    },
    
    get_lsid: function(event) {
        return this._protect(this.options.data.lsid, "");
    },
    
    get_data: function() {
    	return this.options.data;
    },
    
    get_click: function() {
    	return this.options.click;
    },

    tagClick: function(event) {
        this.options.tagclick(event);
    },

    stopProp: function(event) {
        event.stopPropagation();
    },

    showMenu: function() {
        $(".module-menu").hide();
        var menu = $(this.element).find('.module-menu');
        var top = $(this.element).position().top + 30;
        var left = $(this.element).position().left + $(this.element).width() - menu.width();

        menu.css("position", "absolute");
        menu.css("top", top);
        menu.css("left", left);
        menu.show();

        $(document).click(function() {
            menu.hide();
            $(document).unbind("click");
        });
    },

    expand: function() {
        $(".module-menu").hide();

        var offset = $(this.element).offset();
        var width = $(this.element).width();

        var clone = $(this.element).clone()
            .attr("class", "module-expanded")
            .css("top", offset.top)
            .css("left", offset.left)
            .css("width", width)
            .css("display", "none")
            .appendTo("body")
            .show("blind", 300);

        clone.find(".truncate_more").show();
        clone.find(".truncate_ellipsis").hide();
        clone.find(".clearboth").hide();

        $(document).click(function() {
            clone.hide("blind", 300);
            setTimeout(function() {
                clone.remove();
            }, 301);
            $(document).unbind("click");
        });
    },

    remove: function() {
        $(".module-menu").hide();

        var moduleList = $(this.element).closest(".module-list");
        moduleList.modulelist("remove", null, {item: this.element});

        $(this.element).remove();
    },

    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {
        // remove generated elements
        this.name.remove();
        this.version.remove();
        this.doc.remove();
        this.description.remove();
        this.gear.remove();
        this.menu.remove();
        this.tags.remove();
        //this.lsidBox.remove();

        this.element.removeClass('module-listing');
    },

    // _setOptions is called with a hash of all options that are changing
    _setOptions: function() {
        // _super and _superApply handle keeping the right this-context
        this._superApply(arguments);
    },

    // _setOption is called for each individual option that is changing
    _setOption: function(key, value) {
        this._super(key, value);
    }
});

$.widget("gp.modulelist", {
    // default options
    options: {
        title: null,
        data: {},
        droppable: false,
        draggable: true,
        click: function() {},
        add: function(event, ui) {},
        remove: function(event, ui) {},
        reposition: function(event, ui) {}
    },

    // the constructor
    _create: function() {
        this.element.addClass('module-list');

        if (this.options.title) {
            this.title = $('<h4>', {
                'class': 'module-list-title',
                'html': this.options.title
            }).appendTo(this.element);
        }
        
        this.empty = $('<h4>', {
            'class': 'module-list-empty',
            'text': "No Results Found"
        }).appendTo(this.element);

        this.listings = [];
        for (var id in this.options.data) {
            this.listings.push($('<div>').module({
                data: this.options.data[id],
                click: this.options.click,
                draggable: this.options.draggable
            }).appendTo(this.element));
        }        

        if (this.options.droppable) {
        	var thisModuleList = this;
        	var thisList = $(this.element);
        	var sortableIn = 1;
        	var target = null;
            $(this.element).sortable({
            	items: '> .module-listing',
                connectWith: '.module-list',
                scroll: false,
                drop: function(event, ui) {
                    ui.draggable.data('dropped', true);
                },
                update: function(event, ui) {
                	// Hide and show "drop here"
                	if ($(event.target).find(".module-listing").length < 1) {
                		thisList.find(".module-list-empty").show();
                	}
                	else {
                		thisList.find(".module-list-empty").hide();
                	}  	
                },
                receive: function(event, ui) { 
                	sortableIn = 1;    
                },
                over: function(event, ui) { 
                	sortableIn = 1;
                	thisList.find(".module-list-empty").hide();
                },
                out: function(event, ui) { 
                	sortableIn = 0; 
                	
                	// Hide and show "drop here"
                	if ($(event.target).find(".module-listing:visible:not(.ui-sortable-placeholder)").length < 1) {
                		thisList.find(".module-list-empty").show();
                	}
                	else {
                		thisList.find(".module-list-empty").hide();
                	}  
                },
                beforeStop: function(event, ui) {
                   if (sortableIn == 0) { 
                      ui.item.remove();
                      thisModuleList.options.remove(event, ui);
                   }
                   else {
                	   if (target === 'pinned-modules') {
                		   thisModuleList.options.reposition(event, ui);
                	   }
                	   else {              		   
                		   if (thisModuleList._lsidInstances(ui.item) > 1) {
                			   ui.item.remove();
                			   return;
                		   }
                		   thisModuleList.options.add(event, ui);
                	   }	   
                   }
                },
                stop: function(event, ui) {
                	if (thisList.find(".module-listing").length < 1) {
                 	   thisList.find(".module-list-empty").show();
                    }
                	$(ui.item).addClass('noclick');
                	setTimeout(function() {
                		$(ui.item).removeClass('noclick');
                	}, 100);
                },
                start: function(event, ui) {
                	target = $(event.currentTarget).attr('id');
                	$(ui.item).addClass('noclick');
                }
            });
            $(this.element).disableSelection();
        }
    },

    filter: function(filter) {
        var numberHidden = 0
        for (var i = 0; i < this.listings.length; i++) {
            var listing = this.listings[i];
            var searchText = listing.find(".module-name, .module-description, .module-tag").text();
            if (searchText.toLowerCase().indexOf(filter.toLowerCase()) < 0) {
                listing.hide();
                numberHidden++;
            }
            else {
                listing.show();
            }
        }
        if (numberHidden >= this.listings.length) {
            // All hidden, hide title as well
            this.empty.show();
        }
        else {
            this.empty.hide();
        }
    },

    tagfilter: function(filter) {
        var numberHidden = 0
        for (var i = 0; i < this.listings.length; i++) {
            var listing = this.listings[i];
            var listing_tags = listing.find(".module-tag");
            if (listing_tags.text().toLowerCase().indexOf(filter.toLowerCase()) < 0) {
                listing.hide();
                numberHidden++;
            }
            else {
                listing.show();
            }
        }
        if (numberHidden >= this.listings.length) {
            // All hidden, hide title as well
            this.empty.show();
        }
        else {
            this.empty.hide();
        }
    },

    set_title: function(title) {
        this.element.find(".module-list-title").html(title);
    },
    
    get_module: function(lsid) {
        for (var i = 0; i < this.listings.length; i++) {
            var listing = this.listings[i];
            var listing_lsid = listing.find(".module-lsid");
            if (listing_lsid.text().indexOf(lsid) >= 0) {
                return listing;
            }
        }
        
        return null;
    },

    select_default: function(filter) {
        var first = null;
        var exact = null;

        $(this.element).find(".module-listing:visible").each(function() {
            if (first === null) {
                first = $(this);
            }

            if (exact === null && $(this).find(".module-name").text().toLowerCase() === filter.toLowerCase()) {
                exact = $(this);
            }
        });

        // Call click on the module & return
        if (exact !== null) {
            exact.trigger("click");
            return exact;
        }
        else if (first !== null) {
            first.trigger("click");
            return first;
        }
        else {
            return false;
        }
    },

    remove: function(event, ui) {
        this.options.remove(event, ui);
    },
    
    _lsidInstances: function(listing) {
    	var lsid = $(listing).find(".module-lsid").text();
    	var lsid_list = $(this.element).find(".module-lsid");
    	var found = 0;
    	for (var i = 0; i < lsid_list.length; i++) {
    		if ($(lsid_list[i]).text() == lsid) {
    			found++;
    		}
    	}
    	return found;
    },

    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {
        // remove generated elements
        this.title.remove();
        for (var i in this.listings) {
            i.remove();
        }
        this.element
            .removeClass('module-list');
    },

    // _setOptions is called with a hash of all options that are changing
    _setOptions: function() {
        // _super and _superApply handle keeping the right this-context
        this._superApply(arguments);
    },

    // _setOption is called for each individual option that is changing
    _setOption: function(key, value) {
        this._super(key, value);
    }
});

$.widget("gp.searchslider", {
    // default options
    options: {
        lists: []
    },

    // the constructor
    _create: function() {
        this.element.addClass('search-widget');

        // Add the titlebar
        this.titlebar = $('<div>', {
            'class': 'search-titlebar' })
            .append(
                $('<div>', {
                    'class': 'module-list-title'
                })
            )
            .appendTo(this.element);

        // Add the inner div
        this.inner = $('<div>', {
            'class': 'search-inner'})
            .appendTo(this.element);
        var inner = this.inner;
        var slider = this.element;
        var titlebar = this.titlebar;

        // Add the close button
        this.close = $("<div>", {
            class: 'slider-close-block'})
            .appendTo(this.titlebar);
        $('<button></button>', {
            'class': 'slider-close',
            'text': 'X' })
            .button()
            .click(function() {
            	$("#module-search-box").val("");
                slider.searchslider('hide');
            })
            .appendTo(this.close);

        // Add the module lists
        var firstList = true;
        $(this.options.lists).each(function(index, list) {
            if (firstList) {
                var title = $(list).find(".module-list-title");
                titlebar.find(".module-list-title").text(title.text());
                title.hide();
                firstList = false;
            }
            inner.append(list);
        });
    },

    show: function() {
        var visible = $(".search-widget:visible");
        visible.each(function(id, slider) {
            $(slider).css("z-index", 3001);
        });
        var shown = this.element;
        this.element.css("z-index", 3002);
        this.element.show('slide', {}, 400);
        setTimeout(function() {
            visible.each(function(id, slider) {
                if (slider !== shown[0]) {
                    $(slider).hide();
                }
            });
        }, 400);
    },

    hide: function() {
        this.element.hide('slide', {}, 400);
    },

    filter: function(filter) {
        $(this.options.lists).each(function(index, list) {
            list.modulelist("filter", filter);
        });
    },

    tagfilter: function(filter) {
        $(this.options.lists).each(function(index, list) {
            list.modulelist("tagfilter", filter);
        });
    },

    set_title: function(title) {
        if (this.options.lists.length >= 1) {
            $(this.options.lists[0]).modulelist("set_title", title);
        }
    },

    select_default: function(filter) {
        for (var i = 0; i < this.options.lists.length; i++) {
            var list = this.options.lists[i];
            var selected = $(list).modulelist("select_default", filter);
            if (selected) {
                break;
            }
        }
    },

    // events bound via _on are removed automatically
    // revert other modifications here
    _destroy: function() {
        // remove generated elements
        this.inner.remove();
        this.element
            .removeClass('module-list');
    },

    // _setOptions is called with a hash of all options that are changing
    _setOptions: function() {
        // _super and _superApply handle keeping the right this-context
        this._superApply(arguments);
    },

    // _setOption is called for each individual option that is changing
    _setOption: function(key, value) {
        this._super(key, value);
    }
});