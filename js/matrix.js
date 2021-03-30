class Matrix {

  constructor(_config, _data, _attribute) {
    this.config = {
      parentElement: _config.parentElement,
      dispatch: _config.dispatch || null,
      containerWidth: 500,
      containerHeight: 500,
      margin: { top: 100, right: 20, bottom: 20, left: 100 }
    }
    this.data = _data;
    this.attribute = _attribute;
    this.dispatch = this.config.dispatch;
    this.initVis();
  }

  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.chart = vis.chartArea.append('g');

    // Initialize scales and axes
    vis.colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateGreens);

    vis.xScale = d3.scaleBand()
      .range([0, vis.config.width])
      .paddingInner(0.2);

    vis.yScale = d3.scaleBand()
      .range([0, vis.config.height])
      .paddingInner(0.2);

    vis.xAxis = d3.axisTop(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale);

    // Append axis groups
    vis.xAxisGroup = vis.chart.append('g')
      .attr('class', 'axis x-axis');

    vis.yAxisGroup = vis.chart.append('g')
      .attr('class', 'axis y-axis');

    // Append text labels (https://bl.ocks.org/d3noob/23e42c8f67210ac6c678db2cd07a747e)
    vis.chart.append('text')
    .attr('transform', 'rotate(90)')
    .attr('x', -20)
    .attr('y', 10)
    .style('text-anchor', 'end')
    .text('Female');

    vis.chart.append('text')
    .attr('x', -20)
    .attr('y', -10)
    .style('text-anchor', 'end')
    .text('Male');

    vis.updateVis();
  }

  updateVis() {
    let vis = this;

    vis.cellData = [];

    if (vis.attribute == 'age') {
      for (let i = 18; i <= 45; i++) {
        for (let j = 18; j <= 45; j++) {
          vis.cellData.push({
            row: i - 17,
            col: j - 17,
            rowLabel: getLabel(vis.attribute, i),
            colLabel: getLabel(vis.attribute, j),
            value: vis.data[i][j]
          });
        }
      }
    } else {
      for (let i = 1; i < vis.data.length; i++) {
        for (let j = 1; j < vis.data[0].length; j++) {
          vis.cellData.push({
            row: i,
            col: j,
            rowLabel: getLabel(vis.attribute, i),
            colLabel: getLabel(vis.attribute, j),
            value: vis.data[i][j]
          });
        }
      }
    }

    vis.xValue = d => d.colLabel;
    vis.yValue = d => d.rowLabel;
    vis.colorValue = d => d.value;

    vis.colorScale.domain(d3.extent(vis.cellData.map(vis.colorValue)));
    vis.xScale.domain(vis.cellData.map(vis.xValue));
    vis.yScale.domain(vis.cellData.map(vis.yValue));

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    const cellWidth = vis.config.width / vis.xScale.domain().length;
    const cellHeight = vis.config.height / vis.yScale.domain().length;

    const cell = vis.chart.selectAll('.cell')
      .data(vis.cellData);

    // Enter
    const cellEnter = cell.enter().append('rect')

    // Enter + update
    cellEnter.merge(cell)
      .transition().duration(1000)
      .attr('class', 'cell')
      .attr('x', d => (d.col - 1) * cellWidth) //-1 because code are 1-indexed
      .attr('y', d => (d.row - 1) * cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('stroke', 'white')
      .attr('fill', d => d.col == 0 || d.row == 0 ? 'white' : vis.colorScale(vis.colorValue(d)));

    cellEnter.on('mouseover', (e, d) => { //Tooltip: https://github.com/UBC-InfoVis/2021-436V-case-studies/blob/097d13b05d587f4fab3e3fcd23f5e99274397c2c/case-study_measles-and-vaccines/css/style.css
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', (e.pageX) + 'px')
        .style('top', (e.pageY) + 'px')
        .html(`
          <div>A male ${getLabel(vis.attribute, d.row)} and </div>
          <div>a female ${getLabel(vis.attribute, d.col)} </div>
          <div>matches ${d3.format('.0%')(d.value)} of the time.</div>
        `);
    })
      .on('mouseout', (e, d) => {
        d3.select('#tooltip').style('display', 'none');
      });

    // Exit
    cell.exit().remove();

    // Add 'Half-your-age-plus-seven' rule lines
    vis.ageLine1 = vis.chartArea.append('line')
      .attr('class', 'age-line');
    vis.ageLine2 = vis.chartArea.append('line')
      .attr('class', 'age-line');

    if (vis.attribute == 'age') {
      vis.ageLine1
        .attr('x1', (17 - 17) * cellWidth)
        .attr('y1', (20 - 17) * cellWidth)
        .attr('x2', (29.5 - 17) * cellWidth)
        .attr('y2', (45 - 17) * cellWidth)
        .style('stroke', 'black')
        .style('stroke-width', 1);

      vis.ageLine2
        .attr('x1', (20 - 17) * cellWidth)
        .attr('y1', (17 - 17) * cellWidth)
        .attr('x2', (45 - 17) * cellWidth)
        .attr('y2', (29.5 - 17) * cellWidth)
        .style('stroke', 'black')
        .style('stroke-width', 1);
    } else {
      vis.chartArea.selectAll('line').remove();
    }

    // Update axes
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll('text')
      .attr('y', 0)
      .attr('x', -10)
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'end'); //https://bl.ocks.org/mbostock/4403522;
    vis.yAxisGroup.call(vis.yAxis);

    d3.selectAll(`${vis.config.parentElement} .y-axis .tick`) //https://stackoverflow.com/a/32658330
      .on('click', function (event, selected) {
        vis.dispatch.call('matrixClick', selected, selected, 'male');
      });

    d3.selectAll(`${vis.config.parentElement} .x-axis .tick`)
      .on('click', function (event, selected) {
        vis.dispatch.call('matrixClick', selected, selected, 'female');
      });
  }
}
