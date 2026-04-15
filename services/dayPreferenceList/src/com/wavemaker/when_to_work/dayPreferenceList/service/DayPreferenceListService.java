package com.wavemaker.when_to_work.dayPreferenceList.service;


import com.wavemaker.when_to_work.dayPreferenceList.model.*;
import com.wavemaker.when_to_work.dayPreferenceList.model.RootRequest;
import com.wavemaker.when_to_work.dayPreferenceList.model.RootResponse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.lang.Object;
import org.springframework.util.MultiValueMap;
import feign.*;

public interface DayPreferenceListService {

  /**
   * 
   * 
    * @param body RequestBody (optional)
   * @return RootResponse
   */
  @RequestLine("POST /preferences/day/list")
  @Headers({
    "Content-Type: application/json",
    "Accept: */*",  })
  RootResponse invoke(RootRequest body);

}
