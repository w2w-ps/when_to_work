package com.wavemaker.when_to_work.GetPositions.service;


import com.wavemaker.when_to_work.GetPositions.model.*;
import com.wavemaker.when_to_work.GetPositions.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface GetPositionsService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("GET /positions")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("Authorization") String Authorization);

}
