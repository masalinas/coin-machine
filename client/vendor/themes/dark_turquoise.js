(function() {
    function c() {
        return b.anychart.color.lighten(this.sourceColor)
    }

    function d() {
        return b.anychart.color.darken(this.sourceColor)
    }

    function a() {
        return b.anychart.color.setOpacity(this.sourceColor, .6, !0)
    }
    var b = this;
    b.anychart = b.anychart || {};
    b.anychart.themes = b.anychart.themes || {};
    b.anychart.themes.darkTurquoise = {
        palette: {
            type: "distinct",
            items: "#80deea #00acc1 #00838f #29b6f6 #0277bd #0277bd #8c9eff #9575cd #ce93d8 #8e24aa".split(" ")
        },
        defaultOrdinalColorScale: {
            autoColors: function(a) {
                return b.anychart.color.blendedHueProgression("#b2dfdb",
                    "#00838f", a)
            }
        },
        defaultLinearColorScale: {
            colors: ["#b2dfdb", "#00838f"]
        },
        defaultFontSettings: {
            fontFamily: '"Lucida Console", Monaco, monospace',
            fontColor: "#e0e0e0",
            fontSize: 12
        },
        defaultBackground: {
            fill: "#424242",
            stroke: "#909090",
            cornerType: "round",
            corners: 0
        },
        defaultAxis: {
            stroke: "#929292 0.8",
            labels: {
                enabled: !0
            },
            ticks: {
                stroke: "#929292"
            },
            minorTicks: {
                stroke: "#757575"
            }
        },
        defaultGridSettings: {
            stroke: "#929292 0.8"
        },
        defaultMinorGridSettings: {
            stroke: "#757575 0.6"
        },
        defaultSeparator: {
            fill: "#757575"
        },
        defaultTooltip: {
            background: {
                fill: "#424242 0.9",
                stroke: "#909090 0.9",
                corners: 3
            },
            fontColor: "#e0e0e0",
            fontSize: 12,
            title: {
                fontColor: "#bdbdbd",
                align: "center",
                fontSize: 14
            },
            padding: {
                top: 10,
                right: 15,
                bottom: 10,
                left: 15
            },
            separator: {
                margin: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            }
        },
        defaultColorRange: {
            stroke: "#757575",
            ticks: {
                stroke: "#757575",
                position: "outside",
                length: 7,
                enabled: !0
            },
            minorTicks: {
                stroke: "#757575",
                position: "outside",
                length: 5,
                enabled: !0
            },
            marker: {
                padding: {
                    top: 3,
                    right: 3,
                    bottom: 3,
                    left: 3
                },
                fill: "#616161",
                hoverFill: "#616161"
            }
        },
        defaultScroller: {
            fill: "#616161",
            selectedFill: "#757575",
            thumbs: {
                fill: "#bdbdbd",
                stroke: "#616161",
                hoverFill: "#e0e0e0",
                hoverStroke: "#757575"
            }
        },
        chart: {
            defaultSeriesSettings: {
                base: {
                    selectStroke: "1.5 #fafafa",
                    selectMarkers: {
                        stroke: "1.5 #fafafa"
                    }
                },
                lineLike: {
                    selectStroke: "3 #fafafa"
                },
                areaLike: {
                    selectStroke: "3 #fafafa"
                },
                marker: {
                    selectStroke: "1.5 #fafafa"
                },
                candlestick: {
                    risingFill: "#80deea",
                    risingStroke: "#80deea",
                    hoverRisingFill: c,
                    hoverRisingStroke: d,
                    fallingFill: "#00838f",
                    fallingStroke: "#00838f",
                    hoverFallingFill: c,
                    hoverFallingStroke: d,
                    selectRisingStroke: "3 #80deea",
                    selectFallingStroke: "3 #00838f",
                    selectRisingFill: "#333333 0.85",
                    selectFallingFill: "#333333 0.85"
                },
                ohlc: {
                    risingStroke: "#80deea",
                    hoverRisingStroke: d,
                    fallingStroke: "#00838f",
                    hoverFallingStroke: d,
                    selectRisingStroke: "3 #80deea",
                    selectFallingStroke: "3 #00838f"
                }
            },
            title: {
                fontSize: 14
            },
            padding: {
                top: 20,
                right: 25,
                bottom: 15,
                left: 15
            }
        },
        pieFunnelPyramidBase: {
            labels: {
                fontColor: null
            },
            selectStroke: "1.5 #fafafa",
            connectorStroke: "#757575",
            outsideLabels: {
                autoColor: "#e0e0e0"
            },
            insideLabels: {
                autoColor: "#424242"
            }
        },
        cartesianBase: {
            defaultSeriesSettings: {
                box: {
                    selectMedianStroke: "#fafafa",
                    selectStemStroke: "#fafafa",
                    selectWhiskerStroke: "#fafafa",
                    selectOutlierMarkers: {
                        enabled: null,
                        size: 4,
                        fill: "#fafafa",
                        stroke: "#fafafa"
                    }
                }
            },
            defaultXAxisSettings: {
                ticks: {
                    enabled: !1
                }
            },
            defaultYAxisSettings: {
                ticks: {
                    enabled: !1
                }
            },
            xAxes: [{}],
            grids: [],
            yAxes: []
        },
        financial: {
            yAxes: [{}]
        },
        map: {
            unboundRegions: {
                enabled: !0,
                fill: "#616161",
                stroke: "#757575"
            },
            defaultSeriesSettings: {
                base: {
                    stroke: c,
                    selectStroke: "1.5 #fafafa",
                    labels: {
                        fontColor: "#424242"
                    }
                },
                connector: {
                    selectStroke: "1.5 #000",
                    markers: {
                        stroke: "1.5 #616161"
                    },
                    hoverMarkers: {
                        stroke: "1.5 #616161"
                    },
                    selectMarkers: {
                        fill: "#000",
                        stroke: "1.5 #616161"
                    }
                },
                bubble: {
                    stroke: c,
                    hoverStroke: "1.5 #909090"
                },
                marker: {
                    labels: {
                        fontColor: "#e0e0e0"
                    },
                    stroke: "1.5 #424242",
                    hoverStroke: "1.5 #909090"
                }
            }
        },
        sparkline: {
            padding: 0,
            background: {
                stroke: "#424242"
            },
            defaultSeriesSettings: {
                area: {
                    stroke: "1.5 #80deea",
                    fill: "#80deea 0.5"
                },
                column: {
                    fill: "#80deea",
                    negativeFill: "#00838f"
                },
                line: {
                    stroke: "1.5 #80deea"
                },
                winLoss: {
                    fill: "#80deea",
                    negativeFill: "#00838f"
                }
            }
        },
        bullet: {
            background: {
                stroke: "#424242"
            },
            defaultMarkerSettings: {
                fill: "#80deea",
                stroke: "2 #80deea"
            },
            padding: {
                top: 5,
                right: 10,
                bottom: 5,
                left: 10
            },
            margin: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            rangePalette: {
                items: ["#A4A4A4", "#8C8C8C", "#797979", "#616161", "#4E4E4E"]
            }
        },
        heatMap: {
            stroke: "1 #424242",
            hoverStroke: "1.5 #424242",
            selectStroke: "2 #fafafa",
            labels: {
                fontColor: "#212121"
            }
        },
        treeMap: {
            headers: {
                background: {
                    enabled: !0,
                    fill: "#616161",
                    stroke: "#757575"
                }
            },
            hoverHeaders: {
                fontColor: "#e0e0e0",
                background: {
                    fill: "#757575",
                    stroke: "#757575"
                }
            },
            labels: {
                fontColor: "#212121"
            },
            selectLabels: {
                fontColor: "#fafafa"
            },
            stroke: "#757575",
            selectStroke: "2 #eceff1"
        },
        stock: {
            padding: [20, 30, 20, 60],
            defaultPlotSettings: {
                xAxis: {
                    background: {
                        fill: "#616161 0.3",
                        stroke: "#616161"
                    }
                }
            },
            scroller: {
                fill: "none",
                selectedFill: "#616161 0.3",
                outlineStroke: "#616161",
                defaultSeriesSettings: {
                    base: {
                        selectStroke: a,
                        selectFill: a
                    },
                    lineLike: {
                        selectStroke: a
                    },
                    areaLike: {
                        selectStroke: a,
                        selectFill: a
                    },
                    marker: {
                        selectStroke: a
                    },
                    candlestick: {
                        risingFill: "#999 0.6",
                        risingStroke: "#999 0.6",
                        fallingFill: "#999 0.6",
                        fallingStroke: "#999 0.6",
                        selectRisingStroke: a,
                        selectFallingStroke: a,
                        selectRisingFill: a,
                        selectFallingFill: a
                    },
                    ohlc: {
                        risingStroke: "#999 0.6",
                        fallingStroke: "#999 0.6",
                        selectRisingStroke: a,
                        selectFallingStroke: a
                    }
                }
            }
        }
    }
}).call(this);