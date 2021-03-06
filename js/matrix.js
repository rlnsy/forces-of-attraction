// eslint-disable-next-line no-unused-vars
class Matrix {
  constructor(_config, _data, _attribute, _selectedLabel, _selectedGender) {
    this.config = {
      parentElement: _config.parentElement,
      dispatch: _config.dispatch || null,
      containerWidth: 600,
      containerHeight: 400,
      margin: {
        top: 100, right: 160, bottom: 20, left: 160,
      },
    };
    this.data = _data;
    this.attribute = _attribute;
    this.selectedLabel = _selectedLabel;
    this.selectedGender = _selectedGender;
    this.highlightedMaleLabel = NONE;
    this.highlightedFemaleLabel = NONE;
    this.dispatch = this.config.dispatch;
    this.color = 'gray';
    this.initVis();
  }

  initVis() {
    const vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width = vis.config.containerWidth
        - vis.config.margin.left - vis.config.margin.right;
    vis.config.height = vis.config.containerHeight
        - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.chart = vis.chartArea.append('g');

    vis.chartArea.append('text').text('Probability of match between groups')
      .attr('x', -10)
      .attr('y', vis.config.height + 30);

    // Initialize scales and axes
    vis.colorScale = d3.scaleSequential();
    vis.unhighlightedColorScale = d3.scaleSequential()
      .interpolator(d3.interpolateGreys);

    vis.xScale = d3.scaleBand()
      .range([0, vis.config.width]);

    vis.yScale = d3.scaleBand()
      .range([0, vis.config.height]);

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
      .style('font-weight', 'bold')
      .text('Female');

    vis.chart.append('text')
      .attr('x', -20)
      .attr('y', -10)
      .style('text-anchor', 'end')
      .style('font-weight', 'bold')
      .text('Male');

    // Add line separating male and female labels
    vis.chart.append('line')
      .attr('class', 'label-line')
      .attr('x1', -60)
      .attr('y1', -60)
      .attr('x2', -10)
      .attr('y2', -10)
      .style('stroke', 'black')
      .style('stroke-width', 1);

    vis.updateVis();
  }

  updateVis() {
    const vis = this;
    vis.colorScale.interpolator(d3.interpolateRgb('white', this.color));

    vis.cellData = [];

    if (vis.attribute === 'age') {
      for (let i = 18; i <= 45; i += 1) {
        for (let j = 18; j <= 45; j += 1) {
          vis.cellData.push({
            row: i - 17,
            col: j - 17,
            rowLabel: getLabel(vis.attribute, i),
            colLabel: getLabel(vis.attribute, j),
            probability: vis.data[i][j].probability,
            match: vis.data[i][j].match,
            pair: vis.data[i][j].pair,
          });
        }
      }
    } else {
      for (let i = 1; i < vis.data.length; i += 1) {
        for (let j = 1; j < vis.data[0].length; j += 1) {
          vis.cellData.push({
            row: i,
            col: j,
            rowLabel: getLabel(vis.attribute, i),
            colLabel: getLabel(vis.attribute, j),
            probability: vis.data[i][j].probability,
            match: vis.data[i][j].match,
            pair: vis.data[i][j].pair,
          });
        }
      }
    }

    vis.xValue = (d) => d.colLabel;
    vis.yValue = (d) => d.rowLabel;
    vis.colorValue = (d) => d.probability;

    vis.colorScale.domain(d3.extent(vis.cellData.map(vis.colorValue)));
    vis.unhighlightedColorScale.domain(d3.extent(vis.cellData.map(vis.colorValue)));
    vis.xScale.domain(vis.cellData.map(vis.xValue));
    vis.yScale.domain(vis.cellData.map(vis.yValue));

    vis.renderVis();
  }

  renderVis() {
    const vis = this;

    const cellWidth = vis.config.width / vis.xScale.domain().length;
    const cellHeight = vis.config.height / vis.yScale.domain().length;

    const cell = vis.chart.selectAll('.cell')
      .data(vis.cellData);

    // Enter
    const cellEnter = cell.enter().append('rect');

    // Enter + update
    cellEnter.merge(cell)
      .transition().duration(500)
      .attr('class', 'cell')
      .attr('x', (d) => (d.col - 1) * cellWidth) // -1 because code are 1-indexed
      .attr('y', (d) => (d.row - 1) * cellHeight)
      .attr('width', cellWidth)
      .attr('height', cellHeight)
      .attr('stroke', (d) => (d.pair <= 0 ? 'none' : 'white'))
      .attr('fill', (d) => {
        if (d.col === 0 || d.row === 0) {
          return 'none';
        } if (d.pair <= 0) {
          return 'none';
        }
        if (vis.highlightedMaleLabel === NONE && vis.highlightedFemaleLabel === NONE) {
          return vis.colorScale(vis.colorValue(d));
        } if (d.rowLabel === vis.highlightedMaleLabel
            || d.colLabel === vis.highlightedFemaleLabel) {
          return vis.colorScale(vis.colorValue(d));
        }
        return vis.unhighlightedColorScale(vis.colorValue(d));
      });

    cellEnter.on('mouseover', (e, d) => { // Tooltip: https://github.com/UBC-InfoVis/2021-436V-case-studies/blob/097d13b05d587f4fab3e3fcd23f5e99274397c2c/case-study_measles-and-vaccines/css/style.css
      d3.select('#tooltip')
        .style('display', 'block')
        .style('left', `${e.pageX + 10}px`)
        .style('top', `${e.pageY + 10}px`)
        .html(vis.generateHtml(d));
    }).on('mouseout', (_, __) => {
      d3.select('#tooltip').style('display', 'none');
    }).on('click', (e, d) => {
      if (d.rowLabel === vis.highlightedMaleLabel && d.colLabel === vis.highlightedFemaleLabel) {
        vis.dispatch.call('matrixCellClick', d, NONE, NONE);
      } else {
        vis.dispatch.call('matrixCellClick', d, d.rowLabel, d.colLabel);
      }
    });

    // Exit
    cell.exit().remove();

    // Add 'Half-your-age-plus-seven' rule lines
    vis.ageLine1 = vis.chartArea.append('line')
      .attr('class', 'age-line');
    vis.ageLine2 = vis.chartArea.append('line')
      .attr('class', 'age-line');

    if (vis.attribute === 'age') {
      const ruleText = '<div>These lines show the boundary for the socially acceptable \'Half-your-age-plus-seven\' rule</div>';
      vis.ageLine1
        .attr('x1', (17 - 17) * cellWidth)
        .attr('y1', (20 - 17) * cellWidth)
        .attr('x2', (29.5 - 17) * cellWidth)
        .attr('y2', (45 - 17) * cellWidth)
        .style('stroke', 'black')
        .style('stroke-width', 1)
        .on('mouseover', (e, _) => {
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', `${e.pageX + 10}px`)
            .style('top', `${e.pageY + 10}px`)
            .html(ruleText);
        });

      vis.ageLine2
        .attr('x1', (20 - 17) * cellWidth)
        .attr('y1', (17 - 17) * cellWidth)
        .attr('x2', (45 - 17) * cellWidth)
        .attr('y2', (29.5 - 17) * cellWidth)
        .style('stroke', 'black')
        .style('stroke-width', 1)
        .on('mouseover', (e, _) => {
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', `${e.pageX + 10}px`)
            .style('top', `${e.pageY + 10}px`)
            .html(ruleText);
        });
    } else {
      vis.chartArea.selectAll('line.age-line').remove();
    }

    // Update axes
    vis.xAxisGroup.call(vis.xAxis)
      .selectAll('text')
      .attr('y', 3)
      .attr('x', -10)
      .attr('transform', 'rotate(90)')
      .style('text-anchor', 'end'); // https://bl.ocks.org/mbostock/4403522;
    vis.yAxisGroup.call(vis.yAxis);

    d3.selectAll(`${vis.config.parentElement} .y-axis .tick`) // https://stackoverflow.com/a/32658330
      .attr('font-weight', (d) => (d === vis.selectedLabel && vis.selectedGender === 'male' ? 'bolder' : 'normal'))
      .on('click', (event, selected) => {
        vis.dispatch.call('matrixLabelClick', selected, selected, 'male');
      });

    d3.selectAll(`${vis.config.parentElement} .x-axis .tick`)
      .attr('font-weight', (d) => (d === vis.selectedLabel && vis.selectedGender === 'female' ? 'bolder' : 'normal'))
      .on('click', (event, selected) => {
        vis.dispatch.call('matrixLabelClick', selected, selected, 'female');
      });
  }

  chooseAlternateMatchType(d) {
    const vis = this;
    const gender = getOtherGender(vis.gender);
    const label = getLabel(vis.attribute, d.row);
    if (label === 'Total') {
      return `any ${gender}`;
    }
    return `${gender} ${label}`;
  }

  generateHtml(d) {
    const vis = this;
    if (vis.attribute === 'field_cd') {
      return `
        <div>A <strong>male ${getLabel(vis.attribute, d.row)} student</strong> and </div>
        <div>a <strong>female ${getLabel(vis.attribute, d.col)} student </strong></div>
        <div>match <strong>${d3.format('.0%')(d.probability)}</strong> of the time.</div>
        <div>(${d.match} matches of ${d.pair} pairings)</div>
    `;
    } if (vis.attribute === 'age') {
      return `
      <div>A <strong>male ${d.rowLabel} year old</strong> and </div>
      <div>a <strong>female ${d.colLabel} year old </strong></div>
        <div>match <strong>${d3.format('.0%')(d.probability)}</strong> of the time.</div>
        <div>(${d.match} matches of ${d.pair} pairings)</div>
    `;
    } if (vis.attribute === 'race') {
      return `
        <div>A <strong>${getLabel(vis.attribute, d.row)} male</strong> and </div>
        <div>a <strong>${getLabel(vis.attribute, d.col)} female</strong></div>
        <div>match <strong>${d3.format('.0%')(d.probability)}</strong> of the time.</div>
        <div>(${d.match} matches of ${d.pair} pairings)</div>
    `;
    }
    return `
        <div>A <strong>male ${getLabel(vis.attribute, d.row)}</strong> and </div>
        <div>a <strong>female ${getLabel(vis.attribute, d.col)} </strong></div>
        <div>match <strong>${d3.format('.0%')(d.probability)}</strong> of the time.</div>
        <div>(${d.match} matches of ${d.pair} pairings)</div>
    `;
  }

  setColor(color) {
    this.color = color;
  }
}
