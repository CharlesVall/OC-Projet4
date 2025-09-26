(function($) {
  $.fn.mauGallery = function(options) {
    // merge sans polluer defaults
    var settings = $.extend({}, $.fn.mauGallery.defaults, options);

    return this.each(function() {
      var $gallery = $(this);
      var tagsCollection = [];

      $.fn.mauGallery.methods.createRowWrapper($gallery);

      if (settings.lightBox) {
        $.fn.mauGallery.methods.createLightBox($gallery, settings.lightboxId, settings.navigation);
      }

      $gallery
        .children(".gallery-item")
        .each(function() {
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this), $gallery);
          $.fn.mauGallery.methods.wrapItemInColumn($(this), settings.columns);

          var theTag = $(this).data("gallery-tag");
          if (settings.showTags && theTag && tagsCollection.indexOf(theTag) === -1) {
            tagsCollection.push(theTag);
          }
        });

      if (settings.showTags) {
        $.fn.mauGallery.methods.showItemTags($gallery, settings.tagsPosition, tagsCollection);
      }

      $.fn.mauGallery.listeners($gallery, settings);

      $gallery.fadeIn(500);
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.listeners = function($gallery, options) {
    $gallery.on("click", ".gallery-item", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId || "galleryLightbox");
      }
    });

    $gallery.on("click", ".nav-link", function() {
      $.fn.mauGallery.methods.filterByTag.call(this, $gallery);
    });

    $gallery.on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage($gallery, options.lightboxId || "galleryLightbox")
    );

    $gallery.on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage($gallery, options.lightboxId || "galleryLightbox")
    );
  };

  $.fn.mauGallery.methods = {
    createRowWrapper($gallery) {
      if (!$gallery.children(".gallery-items-row").length) {
        $gallery.append('<div class="gallery-items-row row"></div>');
      }
    },
    wrapItemInColumn(element, columns) {
      if (typeof columns === "number") {
        element.wrap(`<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`);
      } else if (typeof columns === "object") {
        var columnClasses = "";
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(`Columns should be a number or object. ${typeof columns} is not supported.`);
      }
    },
    moveItemInRowWrapper(element, $gallery) {
      element.appendTo($gallery.find(".gallery-items-row"));
    },
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    prevImage($gallery, lightboxId) {
      let activeImage = $gallery.find("img.gallery-item").filter(function() {
        return $(this).attr("src") === $(".lightboxImage").attr("src");
      });

      let activeTag = $gallery.find(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];

      $gallery.find(".item-column img").each(function() {
        if (activeTag === "all" || $(this).data("gallery-tag") === activeTag) {
          imagesCollection.push($(this));
        }
      });

      let index = imagesCollection.findIndex(img => img.attr("src") === activeImage.attr("src"));
      let prev = imagesCollection[index - 1] || imagesCollection[imagesCollection.length - 1];

      $(".lightboxImage").attr("src", prev.attr("src"));
    },
    nextImage($gallery, lightboxId) {
      let activeImage = $gallery.find("img.gallery-item").filter(function() {
        return $(this).attr("src") === $(".lightboxImage").attr("src");
      });

      let activeTag = $gallery.find(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];

      $gallery.find(".item-column img").each(function() {
        if (activeTag === "all" || $(this).data("gallery-tag") === activeTag) {
          imagesCollection.push($(this));
        }
      });

      let index = imagesCollection.findIndex(img => img.attr("src") === activeImage.attr("src"));
      let next = imagesCollection[index + 1] || imagesCollection[0];

      $(".lightboxImage").attr("src", next.attr("src"));
    },
    createLightBox($gallery, lightboxId, navigation) {
      $gallery.append(`
        <div class="modal fade" id="${lightboxId || "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body position-relative">
                ${
                  navigation
                    ? '<button class="mg-prev btn btn-light position-absolute" style="top:50%;left:0;" aria-label="Précédent">&lt;</button>'
                    : ""
                }
                <img class="lightboxImage img-fluid" alt="Image en plein écran" />
                ${
                  navigation
                    ? '<button class="mg-next btn btn-light position-absolute" style="top:50%;right:0;" aria-label="Suivant">&gt;</button>'
                    : ""
                }
              </div>
            </div>
          </div>
        </div>`);
    },
    showItemTags($gallery, position, tags) {
      var tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item"><span class="nav-link" data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        $gallery.append(tagsRow);
      } else if (position === "top") {
        $gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    filterByTag($gallery) {
      if ($(this).hasClass("active-tag")) return;

      $gallery.find(".active-tag").removeClass("active active-tag");
      $(this).addClass("active active-tag");

      var tag = $(this).data("images-toggle");

      $gallery.find(".gallery-item").each(function() {
        var $itemCol = $(this).parents(".item-column");
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          $itemCol.show(300);
        } else {
          $itemCol.hide();
        }
      });
    }
  };
})(jQuery);
(function($) {
  $.fn.mauGallery = function(options) {
    // merge sans polluer defaults
    var settings = $.extend({}, $.fn.mauGallery.defaults, options);

    return this.each(function() {
      var $gallery = $(this);
      var tagsCollection = [];

      $.fn.mauGallery.methods.createRowWrapper($gallery);

      if (settings.lightBox) {
        $.fn.mauGallery.methods.createLightBox($gallery, settings.lightboxId, settings.navigation);
      }

      $gallery
        .children(".gallery-item")
        .each(function() {
          $.fn.mauGallery.methods.responsiveImageItem($(this));
          $.fn.mauGallery.methods.moveItemInRowWrapper($(this), $gallery);
          $.fn.mauGallery.methods.wrapItemInColumn($(this), settings.columns);

          var theTag = $(this).data("gallery-tag");
          if (settings.showTags && theTag && tagsCollection.indexOf(theTag) === -1) {
            tagsCollection.push(theTag);
          }
        });

      if (settings.showTags) {
        $.fn.mauGallery.methods.showItemTags($gallery, settings.tagsPosition, tagsCollection);
      }

      $.fn.mauGallery.listeners($gallery, settings);

      $gallery.fadeIn(500);
    });
  };

  $.fn.mauGallery.defaults = {
    columns: 3,
    lightBox: true,
    lightboxId: null,
    showTags: true,
    tagsPosition: "bottom",
    navigation: true
  };

  $.fn.mauGallery.listeners = function($gallery, options) {
    $gallery.on("click", ".gallery-item", function() {
      if (options.lightBox && $(this).prop("tagName") === "IMG") {
        $.fn.mauGallery.methods.openLightBox($(this), options.lightboxId || "galleryLightbox");
      }
    });

    $gallery.on("click", ".nav-link", function() {
      $.fn.mauGallery.methods.filterByTag.call(this, $gallery);
    });

    $gallery.on("click", ".mg-prev", () =>
      $.fn.mauGallery.methods.prevImage($gallery, options.lightboxId || "galleryLightbox")
    );

    $gallery.on("click", ".mg-next", () =>
      $.fn.mauGallery.methods.nextImage($gallery, options.lightboxId || "galleryLightbox")
    );
  };

  $.fn.mauGallery.methods = {
    createRowWrapper($gallery) {
      if (!$gallery.children(".gallery-items-row").length) {
        $gallery.append('<div class="gallery-items-row row"></div>');
      }
    },
    wrapItemInColumn(element, columns) {
      if (typeof columns === "number") {
        element.wrap(`<div class='item-column mb-4 col-${Math.ceil(12 / columns)}'></div>`);
      } else if (typeof columns === "object") {
        var columnClasses = "";
        if (columns.xs) columnClasses += ` col-${Math.ceil(12 / columns.xs)}`;
        if (columns.sm) columnClasses += ` col-sm-${Math.ceil(12 / columns.sm)}`;
        if (columns.md) columnClasses += ` col-md-${Math.ceil(12 / columns.md)}`;
        if (columns.lg) columnClasses += ` col-lg-${Math.ceil(12 / columns.lg)}`;
        if (columns.xl) columnClasses += ` col-xl-${Math.ceil(12 / columns.xl)}`;
        element.wrap(`<div class='item-column mb-4${columnClasses}'></div>`);
      } else {
        console.error(`Columns should be a number or object. ${typeof columns} is not supported.`);
      }
    },
    moveItemInRowWrapper(element, $gallery) {
      element.appendTo($gallery.find(".gallery-items-row"));
    },
    responsiveImageItem(element) {
      if (element.prop("tagName") === "IMG") {
        element.addClass("img-fluid");
      }
    },
    openLightBox(element, lightboxId) {
      $(`#${lightboxId}`)
        .find(".lightboxImage")
        .attr("src", element.attr("src"));
      $(`#${lightboxId}`).modal("toggle");
    },
    prevImage($gallery, lightboxId) {
      let activeImage = $gallery.find("img.gallery-item").filter(function() {
        return $(this).attr("src") === $(".lightboxImage").attr("src");
      });

      let activeTag = $gallery.find(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];

      $gallery.find(".item-column img").each(function() {
        if (activeTag === "all" || $(this).data("gallery-tag") === activeTag) {
          imagesCollection.push($(this));
        }
      });

      let index = imagesCollection.findIndex(img => img.attr("src") === activeImage.attr("src"));
      let prev = imagesCollection[index - 1] || imagesCollection[imagesCollection.length - 1];

      $(".lightboxImage").attr("src", prev.attr("src"));
    },
    nextImage($gallery, lightboxId) {
      let activeImage = $gallery.find("img.gallery-item").filter(function() {
        return $(this).attr("src") === $(".lightboxImage").attr("src");
      });

      let activeTag = $gallery.find(".tags-bar span.active-tag").data("images-toggle");
      let imagesCollection = [];

      $gallery.find(".item-column img").each(function() {
        if (activeTag === "all" || $(this).data("gallery-tag") === activeTag) {
          imagesCollection.push($(this));
        }
      });

      let index = imagesCollection.findIndex(img => img.attr("src") === activeImage.attr("src"));
      let next = imagesCollection[index + 1] || imagesCollection[0];

      $(".lightboxImage").attr("src", next.attr("src"));
    },
    createLightBox($gallery, lightboxId, navigation) {
      $gallery.append(`
        <div class="modal fade" id="${lightboxId || "galleryLightbox"}" tabindex="-1" role="dialog" aria-hidden="true">
          <div class="modal-dialog" role="document">
            <div class="modal-content">
              <div class="modal-body position-relative">
                ${
                  navigation
                    ? '<button class="mg-prev btn btn-light position-absolute" style="top:50%;left:0;" aria-label="Précédent">&lt;</button>'
                    : ""
                }
                <img class="lightboxImage img-fluid" alt="Image en plein écran" />
                ${
                  navigation
                    ? '<button class="mg-next btn btn-light position-absolute" style="top:50%;right:0;" aria-label="Suivant">&gt;</button>'
                    : ""
                }
              </div>
            </div>
          </div>
        </div>`);
    },
    showItemTags($gallery, position, tags) {
      var tagItems = '<li class="nav-item"><span class="nav-link active active-tag" data-images-toggle="all">Tous</span></li>';
      $.each(tags, function(index, value) {
        tagItems += `<li class="nav-item"><span class="nav-link" data-images-toggle="${value}">${value}</span></li>`;
      });
      var tagsRow = `<ul class="my-4 tags-bar nav nav-pills">${tagItems}</ul>`;

      if (position === "bottom") {
        $gallery.append(tagsRow);
      } else if (position === "top") {
        $gallery.prepend(tagsRow);
      } else {
        console.error(`Unknown tags position: ${position}`);
      }
    },
    filterByTag($gallery) {
      if ($(this).hasClass("active-tag")) return;

      $gallery.find(".active-tag").removeClass("active active-tag");
      $(this).addClass("active active-tag");

      var tag = $(this).data("images-toggle");

      $gallery.find(".gallery-item").each(function() {
        var $itemCol = $(this).parents(".item-column");
        if (tag === "all" || $(this).data("gallery-tag") === tag) {
          $itemCol.show(300);
        } else {
          $itemCol.hide();
        }
      });
    }
  };
})(jQuery);
