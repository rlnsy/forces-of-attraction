class BarChart {

  constructor(_config, _data, _attribute, _selected) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 500,
      containerHeight: 350,
      margin: { top: 15, right: 15, bottom: 20, left: 170 }
      // TODO: Margin is super large to accomodate super large labels
    }
    this.data = _data;
    this.attribute = _attribute;
    this.selected = _selected;
    this.gender = 'male';
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
    vis.chart = vis.chartArea.append('g');

    // init scales
    vis.xScale = d3.scaleLinear()
      .range([0, vis.width]);
    vis.yScale = d3.scaleBand()
      .range([vis.height, 0])
      .paddingInner(0.2);

    // init axes
    vis.xAxis = d3.axisBottom(vis.xScale)
      .ticks(10)
      .tickSizeOuter(0);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chartArea.append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${vis.height})`);

    // Append y-axis group 
    vis.yAxisG = vis.chartArea.append('g')
      .attr('class', 'axis y-axis');

    // Append axis title
    vis.axisTitle = vis.svg.append('text')
      .attr('class', 'chart-title')
      .attr('x', 0)
      .attr('y', 0)
      .attr('dy', '.80em')
      .text(`Probability of ${vis.selected} Matching with Another Person`);

  }

  updateVis() {
    let vis = this;

    vis.barData = [];
    for (let i = 1; i < vis.data.length; i++) {
      vis.barData.push({
        row: i,
        rowLabel: getLabel(vis.attribute, i),
        value: vis.data[getCode(vis.attribute, vis.selected)][i] * 100
      });
    }

    // Add bar for any match probability
    vis.barData.push({
      row: vis.data.length,
      rowLabel: 'Any',
      value: (1-vis.data[getCode(vis.attribute, vis.selected)][vis.data.length]) * 100
    });

    vis.xValue = d => d.value;
    vis.yValue = d => d.rowLabel;

    vis.xScale.domain([0, 20]);
    vis.yScale.domain(vis.barData.map(vis.yValue));

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.bars = vis.chart.selectAll('.bar')
      .data(vis.barData, vis.yValue)
      .join('rect')
      .attr('class', 'bar')
      .attr('y', d => vis.yScale(vis.yValue(d)))
      .attr('width', d => vis.xScale(vis.xValue(d)))
      .attr('height', vis.yScale.bandwidth())
      .attr('fill', 'green');

    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis)
      .selectAll('text')
      .attr('y', 0)
      .attr('x', -5)
      .style('text-anchor', 'end');

    vis.axisTitle.text(`Probability of ${vis.gender} ${vis.selected} Matching with Another Person`); //https://stackoverflow.com/a/36707865
  }

}