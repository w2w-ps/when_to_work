package com.wavemaker.when_to_work.timeOffRequests.service;


import com.wavemaker.when_to_work.timeOffRequests.model.*;
import com.wavemaker.when_to_work.timeOffRequests.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface TimeOffRequestsService {

  /**
   * 
   * 
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("GET /time-off/requests")
  @Headers({
    "Accept: application/json",
    "Authorization: {Authorization}"  })
  RootResponse invoke(@Param("Authorization") String Authorization);

}
