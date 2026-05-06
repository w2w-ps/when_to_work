package com.wavemaker.when_to_work.requestTimeOff.service;


import com.wavemaker.when_to_work.requestTimeOff.model.*;
import com.wavemaker.when_to_work.requestTimeOff.model.RootRequest;
import com.wavemaker.when_to_work.requestTimeOff.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface RequestTimeOffService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
    * @param Content_Type Content-Type (optional)
    * @param Authorization Authorization (optional)
   * @return RootResponse
   */
  @RequestLine("POST /time-off/requests")
  @Headers({
    "Content-Type: application/json",
    "Accept: application/json",
    "Content-Type: {Content_Type}",

    "Authorization: {Authorization}"  })
  RootResponse invoke(RootRequest body, @Param("Content_Type") String Content_Type, @Param("Authorization") String Authorization);

}
