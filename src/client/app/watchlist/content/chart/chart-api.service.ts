import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import {
  Config,
  CoreApiResponseService,
  LoaderDataTypeEnum
} from '../../../core/index';
import { ChartStateService } from './state/index';
declare let _:any;

@Injectable()
export class ChartApiService extends CoreApiResponseService {
  private params:any = {};
  constructor(public http:Http,
              private chartState:ChartStateService) {
    super(http, chartState);
  }

  load(stock:string, range:string, interval:string) {
    this.params = {stock:stock, range:range, interval:interval};
    this.chartState.fetchLoader(true);
    if(Config.env === 'PROD') {
      let url:string = Config.paths.charts.replace('$stock', stock);
      url = url.replace('$range', range);
      url = url.replace('$interval', interval);
      this.post(Config.paths.proxy, 'url=' + encodeURIComponent(url))
        .subscribe(
          data => this.complete(data),
          error => this.chartState.fetchError(error)
        );
    } else {
      this.get(Config.paths.charts)
        .subscribe(
          data => this.complete(data),
          error => this.chartState.fetchError(error)
        );
    }
  }

  reload() {
    this.load(this.params.stock, this.params.range, this.params.interval);
  }


  private transform(rawData:any):any {
    let data:any = [];

    let chartData:any = _.get(rawData, 'chart.result[0]', {});
    if (chartData) {
      let items:any = {
        close: _.get(chartData, 'indicators.quote[0].close', []),
        high: _.get(chartData, 'indicators.quote[0].high', []),
        low: _.get(chartData, 'indicators.quote[0].low', []),
        open: _.get(chartData, 'indicators.quote[0].open', []),
        volume: _.get(chartData, 'indicators.quote[0].volume', []),
        dates: chartData.timestamp || []
      };

      items.dates.forEach((value:number, index:number) => {
        data.push({
          timestamp: value,
          date: new Date(value * 1000),
          close: _.get(items, 'close[' + index + ']', null),
          high: _.get(items, 'high[' + index + ']', null),
          low: _.get(items, 'low[' + index + ']', null),
          open: _.get(items, 'open[' + index + ']', null),
          volume: _.get(items, 'volume[' + index + ']', null),
        });
      });
    }
    return data;
  }
}
